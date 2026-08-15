#!/usr/bin/env python3
import json
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4000


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        ts = datetime.now().strftime("%H:%M:%S")
        try:
            data = json.loads(body)
            print(f"[{ts}] #{data.get('seq')} {data.get('msg')}", flush=True)
        except json.JSONDecodeError:
            print(f"[{ts}] RAW {body}", flush=True)
        self.send_response(204)
        self.end_headers()

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    print(f"log-sink listening on :{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
