
"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  campaignIQApi,
  type Channel,
  type DailyTrend,
  type DashboardFilters,
} from "@/lib/api";

import { chartTheme } from "@/lib/chart-theme";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function ChartMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

interface ChartProps {
  filters?: DashboardFilters;
}

export function RevenueTrendChart({ filters }: ChartProps) {
  const [data, setData] = useState<DailyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = filters?.start_date;
  const endDate = filters?.end_date;
  const channel = filters?.channel;
  const campaign = filters?.campaign;

  useEffect(() => {
    let cancelled = false;

    async function loadTrends() {
      setLoading(true);
      setError(null);

      try {
        const result = await campaignIQApi.getTrends({
          start_date: startDate,
          end_date: endDate,
          channel,
          campaign,
        });

        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load daily trends. Check the API connection.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTrends();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, channel, campaign]);

  if (loading) return <ChartMessage>Loading daily trends...</ChartMessage>;
  if (error) return <ChartMessage>{error}</ChartMessage>;
  if (data.length === 0) {
    return <ChartMessage>No trend data available for these filters.</ChartMessage>;
  }

  const chartData = data.map((item) => ({
    ...item,
    dateLabel: new Date(`${item.date}T12:00:00`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      },
    ),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 12, right: 16, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            stroke="#e9edf3"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="dateLabel"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8792a2", fontSize: 11 }}
            minTickGap={30}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8792a2", fontSize: 11 }}
            tickFormatter={(value: number) => {
              if (Math.abs(value) >= 1_000_000) {
                return `$${(value / 1_000_000).toFixed(1)}M`;
              }

              if (Math.abs(value) >= 1_000) {
                return `$${(value / 1_000).toFixed(0)}k`;
              }

              return `$${value.toFixed(0)}`;
            }}
            width={65}
            domain={[0, "auto"]}
          />
          
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
            formatter={(value, name) => [
              money(Number(value)),
              String(name),
            ]}
            wrapperStyle={{ zIndex: 50, pointerEvents: "none" }}
            contentStyle={{
              border: "1px solid #e9edf3",
              borderRadius: 12,
              fontSize: 12,
              backgroundColor: "#ffffff",
            }}
          />

          <Line
            type="monotone"
            dataKey="total_revenue"
            name="Revenue"
            stroke={chartTheme.revenue}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />

          <Line
            type="monotone"
            dataKey="total_spend"
            name="Ad spend"
            stroke={chartTheme.spend}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelPerformanceChart({ filters }: ChartProps) {
  const [data, setData] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startDate = filters?.start_date;
  const endDate = filters?.end_date;
  const channel = filters?.channel;
  const campaign = filters?.campaign;

  useEffect(() => {
    let cancelled = false;

    async function loadChannels() {
      setLoading(true);
      setError(null);

      try {
        const result = await campaignIQApi.getChannels({
          start_date: startDate,
          end_date: endDate,
          channel,
          campaign,
        });

        if (!cancelled) {
          setData([...result].sort((a, b) => a.roas - b.roas));
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to load channel performance. Check the API connection.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadChannels();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, channel, campaign]);

  if (loading) {
    return <ChartMessage>Loading channel performance...</ChartMessage>;
  }

  if (error) return <ChartMessage>{error}</ChartMessage>;

  if (data.length === 0) {
    return <ChartMessage>No channel data available for these filters.</ChartMessage>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 18, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            stroke="#e9edf3"
            strokeDasharray="4 4"
            horizontal={false}
          />
          <XAxis
            type="number"
            scale="log"
            domain={[0.1, "auto"]}
            ticks={[0.1, 1, 10, 100, 1000]}
            tickFormatter={(value: number) => `${value}x`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#8792a2", fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="channel"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#657084", fontSize: 11 }}
            width={88}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}x`, "ROAS"]}
            contentStyle={{
              border: "1px solid #e9edf3",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="roas"
            name="ROAS"
            fill={chartTheme.revenue}
            radius={[0, 5, 5, 0]}
            barSize={19}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
