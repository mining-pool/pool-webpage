import type { ReactNode } from "react";
import { Alert, Button, Card, Skeleton, Tag } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRate, formatTime } from "../lib/format";
import { errorText, useT } from "../i18n";
import { useTheme } from "../lib/theme";

export function PageTitle({
  eyebrow,
  title,
  description,
  extra,
}: {
  eyebrow: string;
  title: string;
  description: string;
  extra?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {extra}
    </div>
  );
}
export function QueryState({
  query,
}: {
  query: Pick<UseQueryResult, "isPending" | "error" | "refetch" | "isFetching">;
}) {
  const t = useT();
  if (query.error)
    return (
      <Alert
        className="query-alert"
        type="error"
        showIcon
        title={t.common.loadFailed}
        description={errorText(t, query.error)}
        action={
          <Button
            onClick={() => void query.refetch()}
            loading={query.isFetching}
          >
            {t.common.retry}
          </Button>
        }
      />
    );
  if (query.isPending)
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  return null;
}
export function Refresh({
  query,
}: {
  query: Pick<
    UseQueryResult,
    "dataUpdatedAt" | "isFetching" | "refetch" | "isError"
  >;
}) {
  const t = useT();
  return (
    <div className="refresh">
      <span>
        {query.dataUpdatedAt
          ? (query.isError ? t.common.lastSuccess : t.common.updatedAt)(
              formatTime(query.dataUpdatedAt),
            )
          : t.common.waiting}
      </span>
      <Button
        icon={<ReloadOutlined />}
        loading={query.isFetching}
        onClick={() => void query.refetch()}
      >
        {t.common.refresh}
      </Button>
    </div>
  );
}
export function Metric({
  label,
  value,
  unit,
  note,
  icon,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  note: string;
  icon: ReactNode;
}) {
  return (
    <Card className="metric-card">
      <div className="metric-label">
        {label}
        <span className="metric-icon">{icon}</span>
      </div>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <div className="metric-note">{note}</div>
    </Card>
  );
}
type RateData = {
  hashrate1min: number;
  hashrate30min: number;
  hashrate1h: number;
  hashrate6h: number;
  hashrate1d: number;
};
export function RateChart({ data }: { data: RateData }) {
  const { colors } = useTheme();
  const t = useT();
  const windows = [
    { label: t.rates.m1, rate: data.hashrate1min },
    { label: t.rates.m30, rate: data.hashrate30min },
    { label: t.rates.h1, rate: data.hashrate1h },
    { label: t.rates.h6, rate: data.hashrate6h },
    { label: t.rates.d1, rate: data.hashrate1d },
  ];
  return (
    <Card
      title={t.rates.chartTitle}
      extra={<Tag variant="filled">diff/s</Tag>}
      className="chart-card"
    >
      <p className="card-subtitle">{t.rates.chartSubtitle}</p>
      <div
        className="rate-chart"
        role="img"
        aria-label={windows
          .map((v) => `${v.label}: ${formatRate(v.rate)} diff/s`)
          .join("; ")}
      >
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 600, height: 224 }}
        >
          <BarChart
            data={windows}
            barSize={36}
            margin={{ left: -12, right: 12, top: 18 }}
          >
            <CartesianGrid
              vertical={false}
              stroke={colors.grid}
              strokeDasharray="4 4"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.muted, fontSize: 12 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={formatRate}
              tick={{ fill: colors.muted, fontSize: 11 }}
            />
            <Tooltip
              cursor={{ fill: colors.hover }}
              contentStyle={{
                background: colors.elevated,
                border: `1px solid ${colors.border}`,
                borderRadius: 4,
                color: colors.text,
              }}
              labelStyle={{ color: colors.text }}
              formatter={(value) => [
                `${formatRate(Number(value))} diff/s`,
                t.rates.tooltip,
              ]}
            />
            <Bar
              dataKey="rate"
              fill={colors.bar}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnote">
        <span className="legend-dot" />
        {t.rates.footnote}
      </div>
    </Card>
  );
}
