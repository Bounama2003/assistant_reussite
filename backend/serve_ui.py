import http.server
import json
import logging
import mimetypes
import os
import sys

FRONTEND_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
)

PORT = int(os.environ.get("PORT", 7860))

# API route prefixes — in UI-only mode these must return JSON errors
# so the frontend catch/error handlers fire correctly instead of
# getting HTML pretending to be a 200 OK response.
API_PREFIXES = frozenset({
    "/school", "/lead", "/chat", "/student", "/admin",
    "/upload", "/stats", "/exports", "/health", "/professor",
    "/quiz", "/notifications", "/superadmin", "/documents",
})


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def log_message(self, format, *message):
        logging.info("UI: %s - %s", self.client_address[0], format % message)

    def _is_api_path(self):
        path = self.path.split("?")[0].split("#")[0].rstrip("/")
        for prefix in API_PREFIXES:
            if path.startswith(prefix):
                return True
        return False

    def _send_json_error(self, status, detail):
        body = json.dumps({"detail": detail}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _serve_static_or_spa(self):
        path = self.path.lstrip("/").split("?")[0].split("#")[0]
        file_path = os.path.join(FRONTEND_DIR, path)

        if path and os.path.exists(file_path) and not os.path.isdir(file_path):
            return super().do_GET()

        if "Upgrade" in self.headers and self.headers["Upgrade"].lower() == "websocket":
            self.send_error(400, "WebSocket not available")
            return

        self.path = "/index.html"
        return super().do_GET()

    def do_GET(self):
        if self._is_api_path():
            self._send_json_error(502, "Backend non disponible — mode interface seule")
            return
        self._serve_static_or_spa()

    def do_POST(self):
        if self._is_api_path():
            self._send_json_error(502, "Backend non disponible — mode interface seule")
            return
        self._serve_static_or_spa()

    def do_PUT(self):
        if self._is_api_path():
            self._send_json_error(502, "Backend non disponible — mode interface seule")
            return
        self._serve_static_or_spa()

    def do_DELETE(self):
        if self._is_api_path():
            self._send_json_error(502, "Backend non disponible — mode interface seule")
            return
        self._serve_static_or_spa()

    def do_PATCH(self):
        if self._is_api_path():
            self._send_json_error(502, "Backend non disponible — mode interface seule")
            return
        self._serve_static_or_spa()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Student-Id, X-Admin-Key, X-Professor-Key, X-Super-Admin-Key")
        self.end_headers()


def serve_ui():
    if not os.path.isdir(FRONTEND_DIR):
        print(f"ERROR: Frontend dist not found at {FRONTEND_DIR}", flush=True)
        sys.exit(1)

    mimetypes.add_type("application/javascript", ".js")
    mimetypes.add_type("text/css", ".css")

    server = http.server.HTTPServer(("0.0.0.0", PORT), SPAHandler)
    print(f"UI server listening on http://0.0.0.0:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve_ui()
