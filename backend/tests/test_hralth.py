
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "campaigniq-api",
    }


def test_api_info_returns_version():
    response = client.get("/api/v1")

    assert response.status_code == 200
    assert response.json()["version"] == "0.1.0"
