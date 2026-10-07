import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def client():
    app.config["TESTING"] = True
    return app.test_client()


def test_health():
    r = client().get("/health")
    assert r.status_code == 200
    assert r.get_json()["status"] == "ok"


def test_add_endpoint():
    r = client().get("/api/add?a=10&b=5")
    assert r.get_json()["result"] == 15


def test_divide_by_zero_returns_400():
    r = client().get("/api/divide?a=1&b=0")
    assert r.status_code == 400


def test_unknown_operation_returns_404():
    assert client().get("/api/power?a=2&b=3").status_code == 404
