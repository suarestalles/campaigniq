
from typing import Any

import pandas as pd

from app.services.metrics import REQUIRED_COLUMNS


def calculate_channel_metrics(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Calculate aggregate performance metrics for each marketing channel."""
    required_columns = REQUIRED_COLUMNS | {"channel"}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required columns: {missing}")

    if df.empty:
        return []

    grouped = (
        df.groupby("channel", dropna=False)
        .agg(
            total_impressions=("impressions", "sum"),
            total_clicks=("clicks", "sum"),
            total_spend=("spend", "sum"),
            total_conversions=("conversions", "sum"),
            total_revenue=("revenue", "sum"),
        )
        .reset_index()
    )

    results: list[dict[str, Any]] = []

    for _, row in grouped.iterrows():
        impressions = int(row["total_impressions"])
        clicks = int(row["total_clicks"])
        spend = float(row["total_spend"])
        conversions = int(row["total_conversions"])
        revenue = float(row["total_revenue"])

        results.append(
            {
                "channel": (
                    str(row["channel"])
                    if pd.notna(row["channel"])
                    else None
                ),
                "total_impressions": impressions,
                "total_clicks": clicks,
                "total_spend": round(spend, 2),
                "total_conversions": conversions,
                "total_revenue": round(revenue, 2),
                "ctr": round(clicks / impressions * 100, 2)
                if impressions > 0
                else None,
                "cpc": round(spend / clicks, 2) if clicks > 0 else None,
                "cpa": round(spend / conversions, 2)
                if conversions > 0
                else None,
                "conversion_rate": round(conversions / clicks * 100, 2)
                if clicks > 0
                else None,
                "roas": round(revenue / spend, 2) if spend > 0 else None,
            }
        )

    return sorted(
        results,
        key=lambda item: item["total_revenue"],
        reverse=True,
    )
