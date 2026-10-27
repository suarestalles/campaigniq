
from datetime import date
from pathlib import Path

import pandas as pd

FILTER_COLUMNS = {"date", "campaign", "channel"}


def load_filtered_dataset(
    dataset_path: Path,
    start_date: date | None = None,
    end_date: date | None = None,
    channel: str | None = None,
    campaign: str | None = None,
) -> pd.DataFrame:
    """Load the marketing dataset and apply optional filters."""

    df = pd.read_csv(dataset_path)

    missing_columns = FILTER_COLUMNS - set(df.columns)
    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required filter columns: {missing}")

    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date cannot be after end_date.")

    if start_date or end_date:
        dates = pd.to_datetime(df["date"], errors="coerce")

        if dates.isna().any():
            raise ValueError("Column 'date' contains invalid dates.")

        if start_date:
            df = df.loc[dates >= pd.Timestamp(start_date)]

        if end_date:
            df = df.loc[dates <= pd.Timestamp(end_date)]

    if channel:
        df = df.loc[df["channel"] == channel]

    if campaign:
        df = df.loc[df["campaign"] == campaign]

    return df.copy()
