
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.trends import calculate_daily_trends

client = TestClient(app)


@pytest.fixture
def sample_daily_data() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "date": "2025-01-02",
                "impressions": 1000,
                "clicks": 100,
                "spend": 50.0,
                "conversions": 10,
                "revenue": 200.0,
            },
            {
                "date": "2025-01-01",
                "impressions": 500,
                "clicks": 25,
                "spend": 20.0,
                "conversions": 5,
                "revenue": 100.0,
            },
            {
                "date": "2025-01-02",
                "impressions": 2000,
                "clicks": 200,
                "spend": 100.0,
                "conversions": 20,
                "revenue": 600.0,
            },
        ]
    )


def test_daily_metrics_are_aggregated_correctly(
    sample_daily_data: pd.DataFrame,
) -> None:
    results = calculate_daily_trends(sample_daily_data)

    day = next(
        item for item in results if item["date"] == "2025-01-02"
    )

    assert day["total_impressions"] == 3000
    assert day["total_clicks"] == 300
    assert day["total_spend"] == 150.0
    assert day["total_conversions"] == 30
    assert day["total_revenue"] == 800.0
    assert day["ctr"] == 10.0
    assert day["cpc"] == 0.5
    assert day["cpa"] == 5.0
    assert day["conversion_rate"] == 10.0
    assert day["roas"] == round(800 / 150, 2)


def test_daily_results_are_sorted_chronologically(
    sample_daily_data: pd.DataFrame,
) -> None:
    results = calculate_daily_trends(sample_daily_data)

    assert [item["date"] for item in results] == [
        "2025-01-01",
        "2025-01-02",
    ]


def test_empty_dataframe_returns_empty_list() -> None:
    df = pd.DataFrame(
        columns=[
            "date",
            "impressions",
            "clicks",
            "spend",
            "conversions",
            "revenue",
        ]
    )

    assert calculate_daily_trends(df) == []


def test_invalid_dates_raise_value_error() -> None:
    df = pd.DataFrame(
        [
            {
                "date": "not-a-date",
                "impressions": 100,
                "clicks": 10,
                "spend": 5.0,
                "conversions": 1,
                "revenue": 20.0,
            }
        ]
    )

    with pytest.raises(ValueError, match="invalid dates"):
        calculate_daily_trends(df)


def test_missing_columns_raise_value_error() -> None:
    df = pd.DataFrame({"date": ["2025-01-01"]})

    with pytest.raises(ValueError, match="Missing required columns"):
        calculate_daily_trends(df)


def test_trends_endpoint_returns_expected_fields() -> None:
    response = client.get("/api/v1/trends")

    assert response.status_code == 200

    data = response.json()
    assert len(data) > 0

    expected_fields = {
        "date",
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

    assert expected_fields.issubset(data[0].keys())

    dates = [item["date"] for item in data]
    assert dates == sorted(dates)
