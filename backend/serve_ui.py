"""Minimal static file server for SPA frontend — no backend dependencies."""
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


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def log_message(self, format, *message):
        logging.info("UI: %s - %s", self.client_address[0], format % message)

    def do_GET(self):
        path = self.path.lstrip("/").split("?")[0].split("#")[0]
        file_path = os.path.join(FRONTEND_DIR, path)

        if path and os.path.exists(file_path) and not os.path.isdir(file_path):
            return super().do_GET()

        # SPA fallback — serve index.html for all unknown routes
        self.path = "/index.html"
        return super().do_GET()


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
