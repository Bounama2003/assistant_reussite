import { useEffect, useRef } from "react";
import api from "@/services/api";
import { useNotificationStore } from "@/stores/notificationStore";
import { useToastStore } from "@/stores/toastStore";

export function usePushNotifications(enabled: boolean = true): void {
  const subscribedRef = useRef(false);

  // Separate effect for message listener (must survive StrictMode double-mount)
  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NOTIFICATION") {
        const { title, body, data } = event.data;
        useNotificationStore.getState().addNotification(title, body, data?.url);
        useToastStore.getState().info(title, body);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [enabled]);

  // Separate effect for push subscription (guarded by ref to run once)
  useEffect(() => {
    if (!enabled) return;
    if (subscribedRef.current) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    subscribedRef.current = true;

    const init = async () => {
      let publicKey: string;
      try {
        const res = await api.get("/notifications/public-key");
        publicKey = res.data.public_key;
      } catch {
        return;
      }

      if (Notification.permission === "denied") return;
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;
      }

      let registration: ServiceWorkerRegistration;
      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        return;
      }

      try {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const keyBytes = urlBase64ToUint8Array(publicKey);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keyBytes.buffer,
          } as PushSubscriptionOptionsInit);
        }
        const sub = subscription.toJSON();
        await api.post("/notifications/subscribe", {
          endpoint: sub.endpoint,
          p256dh_key: sub.keys!.p256dh,
          auth_key: sub.keys!.auth,
        });
      } catch {
        // push not available – silent
      }
    };

    init();
  }, [enabled]);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData.split("").map((c) => c.charCodeAt(0)));
}
