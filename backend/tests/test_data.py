
from datetime import date

import pandas as pd
import pytest

from app.services.data import load_filtered_dataset


@pytest.fixture
def dataset_path(tmp_path):
    """Create a small marketing dataset for filter tests."""
    df = pd.DataFrame(
        [
            {
                "date": "2025-01-10",
                "campaign": "campaign-a",
                "channel": "Email",
                "impressions": 1000,
                "clicks": 100,
                "spend": 50.0,
                "conversions": 10,
                "revenue": 200.0,
            },
            {
                "date": "2025-01-20",
                "campaign": "campaign-b",
                "channel": "Social",
                "impressions": 2000,
                "clicks": 150,
                "spend": 75.0,
                "conversions": 15,
                "revenue": 300.0,
            },
            {
                "date": "2025-02-10",
                "campaign": "campaign-a",
                "channel": "Email",
                "impressions": 1500,
                "clicks": 120,
                "spend": 60.0,
                "conversions": 12,
                "revenue": 250.0,
            },
        ]
    )

    path = tmp_path / "marketing-test.csv"
    df.to_csv(path, index=False)
    return path


def test_date_range_is_inclusive(dataset_path):
    df = load_filtered_dataset(
        dataset_path,
        start_date=date(2025, 1, 10),
        end_date=date(2025, 1, 20),
    )

    assert len(df) == 2
    assert set(df["date"]) == {"2025-01-10", "2025-01-20"}


def test_filter_by_channel(dataset_path):
    df = load_filtered_dataset(dataset_path, channel="Email")

    assert len(df) == 2
    assert set(df["channel"]) == {"Email"}


def test_filter_by_campaign(dataset_path):
    df = load_filtered_dataset(dataset_path, campaign="campaign-a")

    assert len(df) == 2
    assert set(df["campaign"]) == {"campaign-a"}


def test_combined_filters(dataset_path):
    df = load_filtered_dataset(
        dataset_path,
        start_date=date(2025, 1, 1),
        end_date=date(2025, 1, 31),
        channel="Email",
        campaign="campaign-a",
    )

    assert len(df) == 1
    assert df.iloc[0]["date"] == "2025-01-10"


def test_inverted_date_range_raises_value_error(dataset_path):
    with pytest.raises(
        ValueError,
        match="start_date cannot be after end_date",
    ):
        load_filtered_dataset(
            dataset_path,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 1, 1),
        )


def test_filters_can_return_empty_dataframe(dataset_path):
    df = load_filtered_dataset(
        dataset_path,
        channel="Nonexistent",
    )

    assert df.empty
