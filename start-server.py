#!/usr/bin/env python3
"""
Simple HTTP server for the PF2e app - CURRENT DEVELOPMENT VERSION
Run this in VSCode terminal or directly from command line
"""

import http.server
import socketserver
import os
import sys

# Change to the directory containing this script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers to allow cross-origin requests
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        # Customize log format
        print(f"[{self.log_date_time_string()}] {format % args}")

try:
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 PF2e App Server starting - CURRENT DEVELOPMENT VERSION...")
        print(f"📂 Serving directory: {os.getcwd()}")
        print(f"🌐 Server running at: http://localhost:{PORT}")
        print(f"📊 Access the app: http://localhost:{PORT}/index.html")
        print(f"⚡ Features: Full encounter generator (1,648 lines) + loot generation")
        print(f"⏹️  Press Ctrl+C to stop the server")
        print("-" * 60)
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n🛑 Server stopped by user")
except OSError as e:
    if e.errno == 98:  # Address already in use
        print(f"❌ Port {PORT} is already in use. Try a different port or stop the existing server.")
    else:
        print(f"❌ Error starting server: {e}")
    sys.exit(1)