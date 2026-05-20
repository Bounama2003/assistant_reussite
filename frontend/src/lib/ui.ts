import { useToastStore } from '@/stores/toastStore';

export const toast = {
  success: (title: string, message?: string) => useToastStore.getState().success(title, message),
  error: (title: string, message?: string) => useToastStore.getState().error(title, message),
  info: (title: string, message?: string) => useToastStore.getState().info(title, message),
  warning: (title: string, message?: string) => useToastStore.getState().warning(title, message),
};
