from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_metrics_endpoint_returns_expected_fields():
    response = client.get("/api/v1/metrics")

    assert response.status_code == 200

    data = response.json()

    expected_fields = {
        "total_impressions",
        "total_clicks",
        "total_spend",
        "total_conversions",
        "total_revenue",
        "ctr",
        "cpc",
        "cpa",
        "conversion_rate",
        "roas",
    }

    assert expected_fields.issubset(data.keys())


def test_metrics_endpoint_returns_valid_totals():
    response = client.get("/api/v1/metrics")

    assert response.status_code == 200

    data = response.json()

    assert data["total_impressions"] > 0
    assert data["total_clicks"] > 0
    assert data["total_spend"] > 0
    assert data["total_conversions"] > 0
    assert data["total_revenue"] > 0