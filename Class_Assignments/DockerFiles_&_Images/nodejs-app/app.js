const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html><head><title>Node.js Deployment</title></head>
<body style="font-family: system-ui, sans-serif; text-align:center; padding:60px;">
  <h1>Hello World from Node.js</h1>
  <p>Deployed with a multi-stage Dockerfile</p>
  <p>Name: Sumit Akhuli &nbsp;|&nbsp; Enrollment No: 24bcs10158</p>
  <p>Container hostname: ${os.hostname()}</p>
  <p>Node version: ${process.version}</p>
</body></html>`);
}).listen(PORT, '0.0.0.0', () => console.log(`Node.js app on port ${PORT}`));
