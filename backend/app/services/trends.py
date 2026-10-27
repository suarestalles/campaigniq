
from typing import Any

import pandas as pd

from app.services.metrics import REQUIRED_COLUMNS


def calculate_daily_trends(df: pd.DataFrame) -> list[dict[str, Any]]:
    """Calculate daily marketing performance metrics."""
    required_columns = REQUIRED_COLUMNS | {"date"}
    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        missing = ", ".join(sorted(missing_columns))
        raise ValueError(f"Missing required columns: {missing}")

    if df.empty:
        return []

    data = df.copy()
    parsed_dates = pd.to_datetime(data["date"], errors="coerce")

    if parsed_dates.isna().any():
        raise ValueError("Column 'date' contains invalid dates.")

    data["date"] = parsed_dates.dt.strftime("%Y-%m-%d")

    grouped = (
        data.groupby("date")
        .agg(
            total_impressions=("impressions", "sum"),
            total_clicks=("clicks", "sum"),
            total_spend=("spend", "sum"),
            total_conversions=("conversions", "sum"),
            total_revenue=("revenue", "sum"),
        )
        .reset_index()
        .sort_values("date")
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
                "date": row["date"],
                "total_impressions": impressions,
                "total_clicks": clicks,
                "total_spend": round(spend, 2),
                "total_conversions": conversions,
                "total_revenue": round(revenue, 2),
                "ctr": round(clicks / impressions * 100, 2)
                if impressions > 0
                else None,
                "cpc": round(spend / clicks, 2)
                if clicks > 0
                else None,
                "cpa": round(spend / conversions, 2)
                if conversions > 0
                else None,
                "conversion_rate": round(conversions / clicks * 100, 2)
                if clicks > 0
                else None,
                "roas": round(revenue / spend, 2)
                if spend > 0
                else None,
            }
        )

    return results
