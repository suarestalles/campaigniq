
import pandas as pd
import pytest

from app.services.metrics import calculate_metrics


def test_calculate_metrics_returns_correct_values():
    df = pd.DataFrame(
        {
            "impressions": [1000, 2000],
            "clicks": [100, 200],
            "spend": [50.0, 100.0],
            "conversions": [10, 20],
            "revenue": [200.0, 400.0],
        }
    )

    result = calculate_metrics(df)

    assert result["total_impressions"] == 3000
    assert result["total_clicks"] == 300
    assert result["total_spend"] == 150.0
    assert result["total_conversions"] == 30
    assert result["total_revenue"] == 600.0
    assert result["ctr"] == 10.0
    assert result["cpc"] == 0.5
    assert result["cpa"] == 5.0
    assert result["conversion_rate"] == 10.0
    assert result["roas"] == 4.0


def test_zero_denominators_return_none():
    df = pd.DataFrame(
        {
            "impressions": [0],
            "clicks": [0],
            "spend": [0.0],
            "conversions": [0],
            "revenue": [100.0],
        }
    )

    result = calculate_metrics(df)

    assert result["ctr"] is None
    assert result["cpc"] is None
    assert result["cpa"] is None
    assert result["conversion_rate"] is None
    assert result["roas"] is None


def test_missing_columns_raise_value_error():
    df = pd.DataFrame({"clicks": [10]})

    with pytest.raises(ValueError, match="Missing required columns"):
        calculate_metrics(df)
