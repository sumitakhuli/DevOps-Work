import os
import socket
import sys

from flask import Flask

app = Flask(__name__)


@app.route("/")
def hello():
    return f"""<!doctype html>
<html>
  <head><title>Python Docker App</title></head>
  <body style="font-family: system-ui, sans-serif; text-align: center; padding: 60px;">
    <h1>Hello World from Python</h1>
    <p>Served by Flask from inside a Docker container</p>
    <p>Hostname (container id): {socket.gethostname()}</p>
    <p>Python version: {sys.version.split()[0]}</p>
  </body>
</html>"""


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
