
from typing import Any

import pandas as pd

REQUIRED_COLUMNS = {
    "impressions",
    "clicks",
    "spend",
    "conversions",
    "revenue",
}


def calculate_metrics(df: pd.DataFrame) -> dict[str, Any]:
    """Calculate aggregate marketing performance metrics."""

    missing_columns = REQUIRED_COLUMNS - set(df.columns)

    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required columns: {missing}")

    impressions = int(df["impressions"].sum())
    clicks = int(df["clicks"].sum())
    spend = float(df["spend"].sum())
    conversions = int(df["conversions"].sum())
    revenue = float(df["revenue"].sum())

    return {
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
