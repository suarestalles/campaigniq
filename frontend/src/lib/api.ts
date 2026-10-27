
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface Metrics {
  total_impressions: number;
  total_clicks: number;
  total_spend: number;
  total_conversions: number;
  total_revenue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  conversion_rate: number;
  roas: number;
}

export interface Campaign extends Metrics {
  campaign: string;
}

export interface Channel extends Metrics {
  channel: string;
}

export interface DailyTrend extends Metrics {
  date: string;
}

export interface DashboardFilters {
  start_date?: string;
  end_date?: string;
  channel?: string;
  campaign?: string;
}

function buildFilterQuery(filters?: DashboardFilters): string {
  if (!filters) {
    return "";
  }

  const params = new URLSearchParams();

  if (filters.start_date) {
    params.set("start_date", filters.start_date);
  }

  if (filters.end_date) {
    params.set("end_date", filters.end_date);
  }

  if (filters.channel) {
    params.set("channel", filters.channel);
  }

  if (filters.campaign) {
    params.set("campaign", filters.campaign);
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `API request failed (${response.status}): ${endpoint}`,
    );
  }

  return response.json() as Promise<T>;
}

export const campaignIQApi = {
  getMetrics: (filters?: DashboardFilters) =>
    fetchApi<Metrics>(
      `/api/v1/metrics${buildFilterQuery(filters)}`,
    ),

  getCampaigns: (filters?: DashboardFilters) =>
    fetchApi<Campaign[]>(
      `/api/v1/campaigns${buildFilterQuery(filters)}`,
    ),

  getChannels: (filters?: DashboardFilters) =>
    fetchApi<Channel[]>(
      `/api/v1/channels${buildFilterQuery(filters)}`,
    ),

  getTrends: (filters?: DashboardFilters) =>
    fetchApi<DailyTrend[]>(
      `/api/v1/trends${buildFilterQuery(filters)}`,
    ),
};
