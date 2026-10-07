"""Demo shop API instrumented for the three pillars: metrics, logs, traces."""
import json
import logging
import os
import random
import time

from flask import Flask, Response, g, jsonify, request
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest

# ---------------- Traces: send spans to Jaeger over OTLP ----------------
provider = TracerProvider(resource=Resource.create({"service.name": "shop-api"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(
    endpoint=os.environ.get("OTLP_ENDPOINT", "http://jaeger:4318/v1/traces"))))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("shop-api")

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app, excluded_urls="metrics,health")

# ---------------- Metrics: exposed on /metrics for Prometheus ----------------
REQUESTS = Counter("shop_http_requests_total", "HTTP requests", ["endpoint", "status"])
LATENCY = Histogram("shop_http_request_duration_seconds", "Request latency", ["endpoint"],
                    buckets=(0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5))
IN_FLIGHT = Gauge("shop_http_in_flight_requests", "Requests being served right now")
HEALTHY = Gauge("shop_app_healthy", "1 if the app's own health check passes")
HEALTHY.set(1)  # the process started and loaded its config


# ---------------- Logs: one JSON line per request, with the trace id ----------------
class JsonFormatter(logging.Formatter):
    def format(self, record):
        span = trace.get_current_span().get_span_context()
        return json.dumps({
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "msg": record.getMessage(),
            "trace_id": format(span.trace_id, "032x") if span.trace_id else None,
            **getattr(record, "extra_fields", {}),
        })


handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
log = logging.getLogger("shop")
log.addHandler(handler)
log.setLevel(logging.INFO)
logging.getLogger("werkzeug").setLevel(logging.WARNING)


@app.before_request
def start_timer():
    g.start = time.perf_counter()
    IN_FLIGHT.inc()


@app.after_request
def record(response):
    IN_FLIGHT.dec()
    if request.path in ("/metrics", "/health"):
        return response
    elapsed = time.perf_counter() - g.start
    endpoint = request.url_rule.rule if request.url_rule else "unknown"
    REQUESTS.labels(endpoint, str(response.status_code)).inc()
    LATENCY.labels(endpoint).observe(elapsed)
    level = logging.ERROR if response.status_code >= 500 else logging.INFO
    log.log(level, f"{request.method} {request.path} {response.status_code}", extra={"extra_fields": {
        "endpoint": endpoint, "status": response.status_code, "duration_ms": round(elapsed * 1000, 1)}})
    return response


@app.get("/health")
def health():
    HEALTHY.set(1)
    return jsonify(status="ok")


@app.get("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)


@app.get("/api/products")
def products():
    with tracer.start_as_current_span("db.query_products"):
        time.sleep(random.uniform(0.01, 0.05))
    return jsonify(products=["keyboard", "mouse", "monitor"])


@app.post("/api/checkout")
def checkout():
    with tracer.start_as_current_span("inventory.reserve"):
        time.sleep(random.uniform(0.02, 0.06))
    with tracer.start_as_current_span("payment.charge") as span:
        # the payment provider is slow sometimes and fails sometimes
        delay = random.choice([0.05, 0.05, 0.05, 0.6])
        span.set_attribute("payment.delay_s", delay)
        time.sleep(delay)
        if random.random() < float(os.environ.get("PAYMENT_FAILURE_RATE", "0.1")):
            span.set_status(trace.Status(trace.StatusCode.ERROR, "card declined by provider"))
            return jsonify(error="payment failed"), 502
    return jsonify(order="created")


@app.get("/api/report")
def report():
    # CPU-heavy endpoint, used to show CPU utilisation in the dashboard
    with tracer.start_as_current_span("report.compute"):
        total = sum(i * i for i in range(300_000))
    return jsonify(total=total)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)  # nosec B104 - runs inside a container
