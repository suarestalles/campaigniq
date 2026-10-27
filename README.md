# CampaignIQ

A full-stack marketing campaign analytics dashboard for measuring performance, comparing channels, and supporting data-driven decisions.

CampaignIQ brings marketing campaign metrics into a single dashboard with interactive visualizations, filters, campaign comparisons, dynamic insights, and CSV export.

## Features

- **Marketing KPIs:** Impressions, clicks, click-through rate (CTR), cost per click (CPC), cost per acquisition (CPA), conversion rate, revenue, and return on ad spend (ROAS).
- **Performance trends:** Visualize daily advertising spend and revenue.
- **Channel comparison:** Compare marketing channels by ROAS.
- **Campaign analysis:** Sort campaigns by revenue, ROAS, spend, or conversions.
- **Interactive filters:** Filter data by date range, channel, and campaign.
- **CSV export:** Export filtered campaign data.
- **Dynamic insights:** Identify the highest-revenue campaign and the best-performing channel by ROAS.
- **Empty states:** Handle filters with no matching data without breaking the dashboard.

## Tech Stack

### Backend

- Python 3.12+
- FastAPI
- pandas
- pytest
- HTTPX
- Ruff
- uv

### Frontend

- Next.js 16
- React 19
- TypeScript
- Recharts
- Tailwind CSS 4
- Lucide React

## Project Structure

```text
campaigniq/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── pyproject.toml
│   └── uv.lock
├── data/
│   └── marketing-campaigns-1000.csv
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
└── README.md
```

## Dataset

The project includes `data/marketing-campaigns-1000.csv`, containing 1,000 marketing campaign records.

| Field | Description |
|---|---|
| `date` | Date associated with the record |
| `campaign` | Campaign identifier or name |
| `channel` | Marketing channel |
| `impressions` | Number of impressions |
| `clicks` | Number of clicks |
| `spend` | Advertising expenditure |
| `conversions` | Number of conversions |
| `revenue` | Revenue attributed to the campaign |

## Key Metrics

| Metric | Calculation |
|---|---|
| CTR | Clicks / Impressions × 100 |
| CPC | Spend / Clicks |
| CPA | Spend / Conversions |
| Conversion Rate | Conversions / Clicks × 100 |
| ROAS | Revenue / Spend |

Metrics with a zero denominator are handled as unavailable rather than dividing by zero.

## Getting Started

### Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- Node.js and npm

### 1. Clone the repository

Replace the placeholder with your actual GitHub repository URL.

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd campaigniq
```

### 2. Set up the backend

From the project root:

```powershell
cd backend
uv sync --dev
uv run uvicorn app.main:app --reload
```

The backend runs at [http://127.0.0.1:8000](http://127.0.0.1:8000).

Interactive API documentation is available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

Keep this terminal running.

### 3. Set up the frontend

Open a second terminal from the project root:

```powershell
cd frontend
```

Create `frontend/.env.local` with the following setting:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Install dependencies and start the frontend:

```powershell
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Both the backend and frontend must be running for the dashboard to retrieve data.

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Health check |
| `GET /api/v1` | API root |
| `GET /api/v1/metrics` | Aggregated marketing metrics |
| `GET /api/v1/campaigns` | Campaign performance data |
| `GET /api/v1/channels` | Channel performance data |
| `GET /api/v1/trends` | Daily performance trends |

The analytics endpoints support filtering by date range, channel, and campaign where applicable.

## Testing

### Backend tests

Run from the `backend/` directory:

```powershell
uv run pytest
uv run ruff check .
```

The backend test suite has passed with 28 tests, and Ruff has completed without errors.

### Frontend validation

Run from the `frontend/` directory:

```powershell
npm run lint
npm run build
```

Both commands completed successfully during local validation.

## Project Goals

CampaignIQ demonstrates practical full-stack development and analytics engineering through:

- REST API development with FastAPI.
- Data processing and metric calculations with pandas.
- Interactive data visualization.
- Integration between a Python backend and a React frontend.
- Automated backend testing.
- Filtering, sorting, and exporting analytical data.

## Future Improvements

- Add continuous integration and automated deployment.
- Deploy the application publicly.
- Expand automated frontend test coverage.
- Introduce additional analytical views and campaign insights.

---

**Status:** MVP implemented and locally validated through backend tests, Ruff checks, a successful frontend production build, and manual functional checks.
