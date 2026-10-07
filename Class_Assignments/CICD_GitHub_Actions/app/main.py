import os

from flask import Flask, jsonify, request

from app.calculator import add, divide, multiply, subtract

app = Flask(__name__)

OPERATIONS = {"add": add, "subtract": subtract, "multiply": multiply, "divide": divide}


@app.get("/health")
def health():
    return jsonify(status="ok", version=os.environ.get("APP_VERSION", "dev"))


@app.get("/api/<op>")
def calculate(op):
    if op not in OPERATIONS:
        return jsonify(error=f"unknown operation '{op}'"), 404
    try:
        a = float(request.args["a"])
        b = float(request.args["b"])
        return jsonify(op=op, a=a, b=b, result=OPERATIONS[op](a, b))
    except (KeyError, ValueError) as e:
        return jsonify(error=str(e)), 400


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
