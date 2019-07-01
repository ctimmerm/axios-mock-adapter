import { createServer, Server } from 'http';
import { AddressInfo } from 'net';

export default function createReplyServer(): Promise<[Server, string]> {
  let serverUrl: string;
  var httpServer: Server;

  return new Promise(function(resolve, reject) {
    httpServer = createServer(function(req, resp) {
      if (req.url === '/error') {
        resp.statusCode = 500;
        resp.end();
      } else {
        resp.statusCode = 200;
        // Reply with path minus leading /
        resp.end((req.url || '').slice(1), 'utf8');
      }
    })
      .listen(0, '127.0.0.1', function() {
        serverUrl = 'http://127.0.0.1:' + (httpServer.address() as AddressInfo).port;
        resolve([httpServer, serverUrl]);
      })
      .on('error', reject);
  });
}
