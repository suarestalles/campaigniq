
import pandas as pd
import pytest

from app.services.campaigns import calculate_campaign_metrics


@pytest.fixture
def sample_campaign_data() -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "campaign": "Campaign A",
                "impressions": 1000,
                "clicks": 100,
                "spend": 50.0,
                "conversions": 10,
                "revenue": 200.0,
            },
            {
                "campaign": "Campaign A",
                "impressions": 2000,
                "clicks": 200,
                "spend": 100.0,
                "conversions": 20,
                "revenue": 600.0,
            },
            {
                "campaign": "Campaign B",
                "impressions": 1000,
                "clicks": 50,
                "spend": 25.0,
                "conversions": 5,
                "revenue": 100.0,
            },
        ]
    )


def test_campaign_metrics_are_aggregated_correctly(
    sample_campaign_data: pd.DataFrame,
) -> None:
    results = calculate_campaign_metrics(sample_campaign_data)

    campaign_a = next(
        item for item in results if item["campaign"] == "Campaign A"
    )

    assert campaign_a["total_impressions"] == 3000
    assert campaign_a["total_clicks"] == 300
    assert campaign_a["total_spend"] == 150.0
    assert campaign_a["total_conversions"] == 30
    assert campaign_a["total_revenue"] == 800.0
    assert campaign_a["ctr"] == 10.0
    assert campaign_a["cpc"] == 0.5
    assert campaign_a["cpa"] == 5.0
    assert campaign_a["conversion_rate"] == 10.0
    assert campaign_a["roas"] == round(800 / 150, 2)


def test_campaigns_are_sorted_by_revenue(
    sample_campaign_data: pd.DataFrame,
) -> None:
    results = calculate_campaign_metrics(sample_campaign_data)

    assert [item["campaign"] for item in results] == [
        "Campaign A",
        "Campaign B",
    ]


def test_empty_dataframe_returns_empty_list() -> None:
    df = pd.DataFrame(
        columns=[
            "campaign",
            "impressions",
            "clicks",
            "spend",
            "conversions",
            "revenue",
        ]
    )

    assert calculate_campaign_metrics(df) == []


def test_missing_columns_raise_value_error() -> None:
    df = pd.DataFrame({"campaign": ["Campaign A"]})

    with pytest.raises(ValueError, match="Missing required columns"):
        calculate_campaign_metrics(df)
