
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
