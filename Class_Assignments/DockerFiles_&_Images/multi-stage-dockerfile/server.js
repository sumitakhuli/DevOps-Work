const http = require('http');
const os = require('os');

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html>
<html>
  <head><title>Docker Multi-Stage Build</title></head>
  <body style="font-family: system-ui, sans-serif; text-align: center; padding: 60px;">
    <h1>Hello World from Docker multi-stage build</h1>
    <p>Name: Sumit Akhuli &nbsp;|&nbsp; Enrollment No: 24bcs10158</p>
    <hr style="max-width:520px; margin:30px auto; border:none; border-top:1px solid #ddd;">
    <p>Container hostname: ${os.hostname()}</p>
    <p>Listening on port: ${PORT}</p>
    <p>Node version: ${process.version}</p>
    <p style="color:#666;">This bundle was produced in the <b>build</b> stage and copied
    into a clean <b>runtime</b> stage — no compiler or node_modules in the final image.</p>
  </body>
</html>`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Multi-stage app listening on port ${PORT}`);
});
