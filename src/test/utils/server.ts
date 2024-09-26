import EventEmitter from 'node:events';
import http from 'node:http';

export default class TestServer extends EventEmitter.EventEmitter {
  server: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
  hostname: string;
  nextResponseHandler: any;
  constructor(hostname: string) {
    super();
    this.server = http.createServer(this.router);
    // Node 8 default keepalive timeout is 5000ms
    // make it shorter here as we want to close server quickly at the end of tests
    this.server.keepAliveTimeout = 1000;
    this.server.on('error', (err) => {
      console.log(err.stack);
    });
    this.server.on('connection', (socket) => {
      socket.setTimeout(1500);
    });
    this.hostname = hostname || 'localhost';
  }

  async start() {
    let host = this.hostname;
    if (host.startsWith('[')) {
      // If we're trying to listen on an IPv6 literal hostname, strip the
      // square brackets before binding to the IPv6 address
      host = host.slice(1, -1);
    }

    this.server.listen(3000, host);
    console.log(
      'listening',
      this.once('listening', () => this.server),
    );
  }

  async stop() {
    this.server.close();
    this.once('close', () => this.server);
  }

  get port() {
    const address = this.server.address();
    return 3000;
  }

  mockResponse(responseHandler: any) {
    this.nextResponseHandler = responseHandler;
    return `http://${this.hostname}:${this.port}/mocked`;
  }

  router(request: any, res: any) {
    const p = request.url;

    if (p === '/mocked') {
      if (this.nextResponseHandler) {
        this.nextResponseHandler(res);
        this.nextResponseHandler = undefined;
      } else {
        throw new Error('No mocked response. Use ’TestServer.mockResponse()’.');
      }
    }
    if (p === '/json-type') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          test: 'json',
        }),
      );
    }
  }
}
