import os
import sys
from urllib.parse import urlparse
import http.server


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        urlparts = urlparse(self.path)
        request_file_path = urlparts.path.strip('/')
        accept_header = self.headers.get('Accept')

        if not os.path.exists(request_file_path) and "text/html" in accept_header:
            self.path = 'index.html'

        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        if self.path.endswith('.html'):
            # guarantee content-type header is present for
            # easier filtration by the pre-renderer
            self.send_header('Content-Type', 'text/html')

        http.server.SimpleHTTPRequestHandler.end_headers(self)

host = '127.0.0.1'
port = 8000
httpd = http.server.ThreadingHTTPServer((host, port), Handler)


print('Serving HTTP on %s port %d ...' % (host, port))
httpd.serve_forever()