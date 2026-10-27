"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  CircleHelp,
  Download,
  LayoutDashboard,
  Megaphone,
  MousePointerClick,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";

import {
  ChannelPerformanceChart,
  RevenueTrendChart,
} from "@/components/dashboard-charts";

import {
  campaignIQApi,
  type Campaign,
  type Channel,
  type DashboardFilters,
  type Metrics,
} from "@/lib/api";

import { chartTheme } from "@/lib/chart-theme";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatRatio = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value)) {
    return "â€”";
  }

  return `${value.toFixed(2)}x`;
};

const formatCampaignName = (name: string) =>
  name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true, href: "#overview" },
  { label: "Campaigns", icon: Megaphone, active: false, href: "#campaigns" },
  { label: "Channels", icon: BarChart3, active: false, href: "#channels" },
];

type MetricCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  detail: string;
};

function MetricCard({
  label,
  value,
  icon: Icon,
  detail,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

type CampaignSortKey =
  | "total_revenue"
  | "total_spend"
  | "total_conversions"
  | "roas";

export default function Home() {

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [channelOptions, setChannelOptions] = useState<Channel[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<Campaign[]>([]);

  const [draftFilters, setDraftFilters] = useState<DashboardFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<DashboardFilters>({});
  const [filterValidation, setFilterValidation] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] =
    useState<CampaignSortKey>("total_revenue");

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const valueA = Number(a[sortBy] ?? 0);
    const valueB = Number(b[sortBy] ?? 0);

    return valueB - valueA;
  });

  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  const kpis = metrics
    ? [
        {
          label: "Total revenue",
          value: formatCompactCurrency(metrics.total_revenue),
          icon: Wallet,
          detail: "Total recorded revenue",
        },
        {
          label: "Ad spend",
          value: formatCompactCurrency(metrics.total_spend),
          icon: ShoppingBag,
          detail: "Total campaign investment",
        },
        {
          label: "Conversions",
          value: formatNumber(metrics.total_conversions),
          icon: Target,
          detail: "Total recorded conversions",
        },
        {
          label: "ROAS",
          value: formatRatio(metrics.roas),
          icon: MousePointerClick,
          detail: "Revenue per $1 spent",
        },
      ]
    : [];

  const topRevenueCampaign = campaigns.reduce<Campaign | null>(
  (best, campaign) => {
    if (!best || campaign.total_revenue > best.total_revenue) {
      return campaign;
    }

    return best;
  },
  null,
);

  const bestRoasChannel = filteredChannels.reduce<Channel | null>(
    (best, channel) => {
      const spend = Number(channel.total_spend ?? 0);
      const revenue = Number(channel.total_revenue ?? 0);

      // ROAS nÃ£o Ã© comparÃ¡vel quando nÃ£o hÃ¡ investimento.
      if (spend <= 0) {
        return best;
      }

      const channelRoas = revenue / spend;

      if (!best) {
        return channel;
      }

      const bestSpend = Number(best.total_spend ?? 0);
      const bestRevenue = Number(best.total_revenue ?? 0);
      const bestRoas = bestSpend > 0 ? bestRevenue / bestSpend : -1;

      return channelRoas > bestRoas ? channel : best;
    },
    null,
  );

  // Carrega as opÃ§Ãµes dos filtros uma Ãºnica vez, sem filtros aplicados.
  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const [channelsData, campaignsData] = await Promise.all([
          campaignIQApi.getChannels(),
          campaignIQApi.getCampaigns(),
        ]);

        if (!cancelled) {
          setChannelOptions(channelsData);
          setCampaignOptions(campaignsData);
        }
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    }

    void loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega os dados do dashboard sempre que os filtros aplicados mudarem.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [metricsData, campaignsData, channelsData] = await Promise.all([
          campaignIQApi.getMetrics(appliedFilters),
          campaignIQApi.getCampaigns(appliedFilters),
          campaignIQApi.getChannels(appliedFilters),
        ]);

        if (!cancelled) {
          setMetrics(metricsData);
          setCampaigns(campaignsData);
          setFilteredChannels(channelsData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);

        if (!cancelled) {
          setError(
            "Unable to load dashboard data. Check that the API is running.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [appliedFilters]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const startDate = draftFilters.start_date ?? "";
    const endDate = draftFilters.end_date ?? "";

    if (startDate && endDate && startDate > endDate) {
      setFilterValidation(
        "The start date cannot be after the end date.",
      );
      return;
    }

    setFilterValidation(null);

    setAppliedFilters({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      channel: draftFilters.channel || undefined,
      campaign: draftFilters.campaign || undefined,
    });
  }

  function clearFilters() {
    setDraftFilters({});
    setAppliedFilters({});
    setFilterValidation(null);
  }

  function exportCampaignsCsv() {
    if (campaigns.length === 0) {
      return;
    }

    const headers = [
      "Campaign",
      "Spend",
      "Revenue",
      "Conversions",
      "ROAS",
    ];

    const rows = campaigns.map((campaign) => [
      campaign.campaign,
      campaign.total_spend,
      campaign.total_revenue,
      campaign.total_conversions,
      campaign.roas,
    ]);

    const escapeCsvValue = (value: string | number) => {
      const text = String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(",")),
    ].join("\r\n");

    // BOM para facilitar a abertura do CSV no Excel.
    const blob = new Blob(["\uFEFF", csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "campaigniq-campaigns.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div id="overview" className="min-h-screen bg-[#f7f8fc] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col bg-[#17172b] text-white lg:flex">
        <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 shadow-lg shadow-violet-950/30">
            <Sparkles size={22} />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">CampaignIQ</p>
            <p className="text-[11px] text-slate-400">MARKETING INTELLIGENCE</p>
          </div>
        </div>

        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
            WORKSPACE
          </p>

          <nav className="space-y-1">
            {navItems.map(({ label, icon: Icon, active, href }) => (
              <a
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  active
                    ? "bg-violet-500/15 font-medium text-violet-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
                {label === "Campaigns" && (
                  <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-xs">
                    12
                  </span>
                )}
              </a>
            ))}
          </nav>

          <p className="mb-3 mt-9 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
            PREFERENCES
          </p>

          <a
            href="#settings"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <Settings size={18} />
            Settings
          </a>
          <a
            href="#help"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <CircleHelp size={18} />
            Help center
          </a>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-2 text-violet-300">
              <Sparkles size={16} />
              <span className="text-sm font-medium">Campaign insights</span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Discover what drives your marketing performance.
            </p>
            <button className="mt-4 w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-medium transition hover:bg-white/15">
              Explore insights
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 text-sm font-semibold">
              CQ
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Marketing Team</p>
              <p className="text-xs text-slate-500">Demo workspace</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[250px]">
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div>
            <p className="text-xs text-slate-400">Workspace / Analytics</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Marketing overview
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              aria-label="Search"
              className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 sm:block"
            >
              <Search size={18} />
            </button>
            <button
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50">
              <span className="hidden sm:inline">Last 30 days</span>
              <span className="sm:hidden">30 days</span>
              <ChevronDown size={15} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] space-y-7 p-5 sm:p-8">
          <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Performance snapshot
              </div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Your marketing at a glance
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Track performance, understand your audience, and make smarter decisions.
              </p>
            </div>

            <button
              onClick={exportCampaignsCsv}
              disabled={loading || campaigns.length === 0}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#635bff] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={16} />
              Export report
            </button>
          </section>

          <section className="rounded-2xl border border-slate-200/80 p-5 shadow-sm shadow-slate-200/30 sm:p-6" style={{ background: `color-mix(in srgb, ${chartTheme.revenue} 30%, transparent)` }}>

          <div className="mb-5">
            <h3 className="font-semibold">Dashboard filters</h3>
            <p className="mt-1 text-xs text-slate-500">
              Choose a date range, channel, or campaign to analyze performance.
            </p>
          </div>

          <form onSubmit={applyFilters}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <label
                  htmlFor="start-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Start date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={draftFilters.start_date ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      start_date: event.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="end-date"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  End date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={draftFilters.end_date ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      end_date: event.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="channel-filter"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Channel
                </label>
                <select
                  id="channel-filter"
                  value={draftFilters.channel ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      channel: event.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">All channels</option>
                  {channelOptions.map((channel) => (
                    <option key={channel.channel} value={channel.channel}>
                      {channel.channel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="campaign-filter"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Campaign
                </label>
                <select
                  id="campaign-filter"
                  value={draftFilters.campaign ?? ""}
                  onChange={(event) =>
                    setDraftFilters((current) => ({
                      ...current,
                      campaign: event.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">All campaigns</option>
                  {campaignOptions.map((campaign) => (
                    <option key={campaign.campaign} value={campaign.campaign}>
                      {formatCampaignName(campaign.campaign)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filterValidation && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {filterValidation}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="rounded-xl bg-[#635bff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                Apply filters
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

          {loading && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Loading dashboard data...
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {metrics && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {kpis.map((kpi) => (
                <MetricCard key={kpi.label} {...kpi} />
              ))}
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className="rounded-xl p-3"
                  style={{
                    color: chartTheme.revenue,
                    background: `color-mix(in srgb, ${chartTheme.revenue} 12%, transparent)`,
                  }}
                >
                  <Trophy size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">
                    Top revenue campaign
                  </p>

                  {loading ? (
                    <p className="mt-2 text-sm text-slate-400">
                      Loading insight...
                    </p>
                  ) : topRevenueCampaign ? (
                    <>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {formatCampaignName(topRevenueCampaign.campaign)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Generated{" "}
                        {formatCurrency(topRevenueCampaign.total_revenue)} in revenue.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No campaign data available for the selected filters.
                    </p>
                  )}
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                  <TrendingUp size={22} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-500">
                    Best-performing channel
                  </p>

                  {loading ? (
                    <p className="mt-2 text-sm text-slate-400">
                      Loading insight...
                    </p>
                  ) : bestRoasChannel ? (
                    <>
                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {bestRoasChannel.channel}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        ROAS of{" "}
                        {formatRatio(
                          Number(bestRoasChannel.total_revenue ?? 0) /
                            Number(bestRoasChannel.total_spend),
                        )}
                        {" "}per $1 spent.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No channel with ad spend is available for the selected filters.
                    </p>
                  )}
                </div>
              </div>
            </article>
          </section>


          <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.65fr_1fr]">
            <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Revenue & ad spend</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Daily performance over time
                  </p>
                </div>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">
                  Selected period
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-5">
                <div>
                  <p className="text-xs text-slate-500">Total revenue</p>
                  <p className="mt-1 text-xl font-semibold">
                    {
                      metrics
                        ? formatCompactCurrency(metrics.total_revenue)
                        : "â€”"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total ad spend</p>
                  <p className="mt-1 text-xl font-semibold">
                    {
                      metrics
                        ? formatCompactCurrency(metrics.total_spend)
                        : "â€”"
                    }
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <RevenueTrendChart filters={appliedFilters} />
              </div>

              <div className="flex flex-wrap gap-5 border-t border-slate-100 pt-4">
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartTheme.revenue }}/>
                  Revenue
                </span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartTheme.spend }} />
                  Ad spend
                </span>
              </div>
            </article>

            <article id="channels" className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
              <div>
                <h3 className="font-semibold">Channel performance</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Return on ad spend by channel
                </p>
              </div>

              <div className="mt-7">
                <ChannelPerformanceChart filters={appliedFilters} />
              </div>

            </article>
          </section>

          <section id="campaigns" className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="font-semibold">Top campaigns</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Review your campaign performance and efficiency
                </p>
              </div>
              <button className="w-fit rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                View all campaigns
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2" style={{ backgroundColor: chartTheme.revenue }}>
              <label
                htmlFor="campaign-sort"
                className="text-sm font-medium text-white"
              >
                Sort by
              </label>

              <select
                id="campaign-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as CampaignSortKey)
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-500"
              >
                <option value="total_revenue">Revenue â€” highest first</option>
                <option value="roas">ROAS â€” highest first</option>
                <option value="total_spend">Spend â€” highest first</option>
                <option value="total_conversions">Conversions â€” highest first</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4 font-medium">Campaign</th>
                    <th className="px-5 py-4 text-right font-medium">Spend</th>
                    <th className="px-5 py-4 text-right font-medium">Revenue</th>
                    <th className="px-5 py-4 text-right font-medium">Conversions</th>
                    <th className="px-5 py-4 text-right font-medium">ROAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedCampaigns.map((campaign) => (
                    <tr
                      key={campaign.campaign}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-900">
                        {formatCampaignName(campaign.campaign)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-slate-600">
                        {formatCurrency(campaign.total_spend)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-slate-900">
                        {formatCurrency(campaign.total_revenue)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-slate-600">
                        {formatNumber(campaign.total_conversions)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-indigo-600">
                        {formatRatio(campaign.roas)}
                      </td>
                    </tr>
                  ))}

                  {!loading && campaigns.length === 0 && !error && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                        No campaign data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {campaigns.length} sample campaigns</span>
              <span>Data provided by the CampaignIQ API</span>
            </div>
          </section>

          <footer className="flex flex-col justify-between gap-2 pb-2 text-xs text-slate-400 sm:flex-row">
            <span>Â© 2026 CampaignIQ. Marketing intelligence made clearer.</span>
            <span>Built for data-driven marketing teams.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
