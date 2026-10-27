
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.channels import calculate_channel_metrics

client = TestClient(app)


@pytest.fixture
def sample_channel_data() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "channel": "Email",
                "impressions": 1000,
                "clicks": 100,
                "spend": 50.0,
                "conversions": 10,
                "revenue": 200.0,
            },
            {
                "channel": "Email",
                "impressions": 2000,
                "clicks": 200,
                "spend": 100.0,
                "conversions": 20,
                "revenue": 600.0,
            },
            {
                "channel": "Paid Search",
                "impressions": 1000,
                "clicks": 50,
                "spend": 25.0,
                "conversions": 5,
                "revenue": 100.0,
            },
        ]
    )


def test_channel_metrics_are_aggregated_correctly(
    sample_channel_data: pd.DataFrame,
) -> None:
    results = calculate_channel_metrics(sample_channel_data)

    email = next(item for item in results if item["channel"] == "Email")

    assert email["total_impressions"] == 3000
    assert email["total_clicks"] == 300
    assert email["total_spend"] == 150.0
    assert email["total_conversions"] == 30
    assert email["total_revenue"] == 800.0
    assert email["ctr"] == 10.0
    assert email["cpc"] == 0.5
    assert email["cpa"] == 5.0
    assert email["conversion_rate"] == 10.0
    assert email["roas"] == round(800 / 150, 2)


def test_channels_are_sorted_by_revenue(
    sample_channel_data: pd.DataFrame,
) -> None:
    results = calculate_channel_metrics(sample_channel_data)

    assert [item["channel"] for item in results] == [
        "Email",
        "Paid Search",
    ]


def test_empty_dataframe_returns_empty_list() -> None:
    df = pd.DataFrame(
        columns=[
            "channel",
            "impressions",
            "clicks",
            "spend",
            "conversions",
            "revenue",
        ]
    )

    assert calculate_channel_metrics(df) == []


def test_missing_columns_raise_value_error() -> None:
    df = pd.DataFrame({"channel": ["Email"]})

    with pytest.raises(ValueError, match="Missing required columns"):
        calculate_channel_metrics(df)


def test_channels_endpoint_returns_expected_fields() -> None:
    response = client.get("/api/v1/channels")

    assert response.status_code == 200

    data = response.json()
    assert len(data) > 0

    expected_fields = {
        "channel",
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
