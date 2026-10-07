import os
import socket
import sys

from flask import Flask

app = Flask(__name__)


@app.route("/")
def hello():
    return f"""<!doctype html>
<html><head><title>Python Deployment</title></head>
<body style="font-family: system-ui, sans-serif; text-align:center; padding:60px;">
  <h1>Hello World from Python</h1>
  <p>Deployed with a multi-stage Dockerfile (wheels built in stage 1)</p>
  <p>Name: Sumit Akhuli &nbsp;|&nbsp; Enrollment No: 24bcs10158</p>
  <p>Container hostname: {socket.gethostname()}</p>
  <p>Python version: {sys.version.split()[0]}</p>
</body></html>"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))
