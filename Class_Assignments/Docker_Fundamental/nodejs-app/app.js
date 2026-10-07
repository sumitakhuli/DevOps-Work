const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html>
  <head><title>Node.js Docker App</title></head>
  <body style="font-family: system-ui, sans-serif; text-align: center; padding: 60px;">
    <h1>Hello World from Node.js</h1>
    <p>Served from inside a Docker container</p>
    <p>Hostname (container id): ${require('os').hostname()}</p>
    <p>Node version: ${process.version}</p>
  </body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Node.js app listening on port ${PORT}`);
});
