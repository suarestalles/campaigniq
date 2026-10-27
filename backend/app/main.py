
from datetime import date
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.services.campaigns import calculate_campaign_metrics
from app.services.channels import calculate_channel_metrics
from app.services.data import load_filtered_dataset
from app.services.metrics import calculate_metrics
from app.services.trends import calculate_daily_trends


def get_filtered_data(
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    channel: Annotated[str | None, Query(min_length=1)] = None,
    campaign: Annotated[str | None, Query(min_length=1)] = None,
):
    if not DATASET_PATH.is_file():
        raise HTTPException(
            status_code=500,
            detail="Marketing dataset not found.",
        )

    try:
        return load_filtered_dataset(
            dataset_path=DATASET_PATH,
            start_date=start_date,
            end_date=end_date,
            channel=channel,
            campaign=campaign,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

app = FastAPI(
    title="CampaignIQ API",
    description="Marketing analytics API for campaign performance analysis.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "campaigniq-api"}


@app.get("/api/v1", tags=["API"])
def api_info() -> dict[str, str]:
    return {
        "name": "CampaignIQ API",
        "version": "0.1.0",
        "status": "running",
    }

DATASET_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "marketing-campaigns-1000.csv"
)


@app.get("/api/v1/metrics", tags=["Metrics"])
def get_metrics(
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    channel: Annotated[str | None, Query(min_length=1)] = None,
    campaign: Annotated[str | None, Query(min_length=1)] = None,
) -> dict:
    """Return aggregate metrics for the filtered marketing dataset."""

    df = get_filtered_data(start_date, end_date, channel, campaign)
    return calculate_metrics(df)


@app.get("/api/v1/campaigns", tags=["Campaigns"])
def get_campaigns(
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    channel: Annotated[str | None, Query(min_length=1)] = None,
    campaign: Annotated[str | None, Query(min_length=1)] = None,
) -> list[dict]:
    """Return campaign metrics for the filtered marketing dataset."""

    df = get_filtered_data(start_date, end_date, channel, campaign)
    return calculate_campaign_metrics(df)


@app.get("/api/v1/channels", tags=["Channels"])
def get_channels(
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    channel: Annotated[str | None, Query(min_length=1)] = None,
    campaign: Annotated[str | None, Query(min_length=1)] = None,
) -> list[dict]:
    """Return channel metrics for the filtered marketing dataset."""

    df = get_filtered_data(start_date, end_date, channel, campaign)
    return calculate_channel_metrics(df)


@app.get("/api/v1/trends", tags=["Analytics"])
def get_daily_trends(
    start_date: Annotated[date | None, Query()] = None,
    end_date: Annotated[date | None, Query()] = None,
    channel: Annotated[str | None, Query(min_length=1)] = None,
    campaign: Annotated[str | None, Query(min_length=1)] = None,
) -> list[dict]:
    """Return daily trends for the filtered marketing dataset."""

    df = get_filtered_data(start_date, end_date, channel, campaign)
    return calculate_daily_trends(df)
