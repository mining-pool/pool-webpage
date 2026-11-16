import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  ClockCircleOutlined,
  DatabaseOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { AddressSearch } from "../components/AddressSearch";
import {
  Metric,
  PageTitle,
  QueryState,
  RateChart,
  Refresh,
} from "../components/Common";
import { PaymentData } from "../components/PaymentData";
import { api } from "../lib/api";
import {
  formatDifficulty,
  formatHashrate,
  hashrateParts,
  validAddress,
} from "../lib/format";
import { useT } from "../i18n";
import { useMetadata, usePayments } from "../lib/queries";

function MinerPayments({ address }: { address: string }) {
  const payments = usePayments(false, address);
  const meta = useMetadata();
  return (
    <>
      <QueryState query={payments} />
      {payments.data !== undefined && (
        <PaymentData
          data={payments.data}
          address={address}
          symbol={meta.data?.coin.symbol}
        />
      )}
    </>
  );
}
function Workers({ address, rigs }: { address: string; rigs: string[] }) {
  const t = useT();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>();
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rigs.length / 8)));
  const visible = [...rigs]
    .sort()
    .slice((currentPage - 1) * 8, currentPage * 8);
  const queries = useQueries({
    queries: visible.map((rig) => ({
      queryKey: ["rig", address, rig],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        api.rig(address, rig, signal),
      refetchInterval: 30000,
    })),
  });
  const detail = useQuery({
    queryKey: ["rig", address, selected],
    queryFn: ({ signal }) => api.rig(address, selected!, signal),
    enabled: !!selected,
    refetchInterval: 30000,
  });
  return (
    <Card
      title={t.miner.rigList}
      extra={<Tag variant="filled">{t.miner.rigCount(rigs.length)}</Tag>}
    >
      <Table
        rowKey="name"
        dataSource={visible.map((name, i) => ({ name, query: queries[i] }))}
        pagination={{
          current: currentPage,
          total: rigs.length,
          pageSize: 8,
          onChange: setPage,
          hideOnSinglePage: true,
          showSizeChanger: false,
        }}
        scroll={{ x: 560 }}
        locale={{ emptyText: t.miner.noRigs }}
        columns={[
          {
            title: t.miner.rigName,
            dataIndex: "name",
            render: (name: string) => (
              <Button
                type="link"
                className="worker-link"
                onClick={() => setSelected(name)}
              >
                <DesktopOutlined />
                {name}
              </Button>
            ),
          },
          {
            title: t.miner.activity,
            render: (_, { query }) =>
              query.isError ? (
                <Button
                  size="small"
                  danger
                  onClick={() => void query.refetch()}
                >
                  {t.common.retry}
                </Button>
              ) : (
                <Tag color={query.data?.hashrate1min ? "green" : "default"}>
                  {query.isPending
                    ? t.common.loading
                    : query.data?.hashrate1min
                      ? t.miner.active
                      : t.miner.idle}
                </Tag>
              ),
          },
          {
            title: t.miner.rate1mCol,
            render: (_, { query }) =>
              formatHashrate(
                query.data?.hashrate1min,
                query.data?.hashrateUnit,
              ),
          },
          {
            title: t.miner.rate1dCol,
            render: (_, { query }) =>
              formatHashrate(query.data?.hashrate1d, query.data?.hashrateUnit),
          },
        ]}
      />
      <p className="card-subtitle">{t.miner.activityNote}</p>
      <Drawer
        open={!!selected}
        onClose={() => setSelected(undefined)}
        title={selected || t.miner.rigDetail}
        size={560}
      >
        <QueryState query={detail} />
        {detail.data && <RateChart data={detail.data} />}
      </Drawer>
    </Card>
  );
}
export default function MinerPage() {
  const t = useT();
  const { address = "" } = useParams();
  const valid = validAddress(address);
  const miner = useQuery({
    queryKey: ["miner", address],
    queryFn: ({ signal }) => api.miner(address, false, signal),
    enabled: valid,
    refetchInterval: 30000,
  });
  return (
    <>
      <PageTitle
        eyebrow={t.miner.eyebrow}
        title={t.miner.title}
        description={t.miner.description}
        extra={valid ? <Refresh query={miner} /> : undefined}
      />
      <Card className="search-card">
        <AddressSearch initial={address} />
      </Card>
      {address && !valid && (
        <Alert type="warning" title={t.miner.invalid} showIcon />
      )}
      {!address && (
        <Card className="miner-empty">
          <Empty description={t.miner.empty} />
        </Card>
      )}
      {valid && (
        <>
          <QueryState query={miner} />
          {miner.data && (
            <>
              <div className="miner-identity">
                <span className="wallet-symbol">W</span>
                <Typography.Text className="mono" copyable>
                  {address}
                </Typography.Text>
                <Tag variant="filled">{t.miner.lookedUp}</Tag>
              </div>
              {!miner.data.rigs.length && (
                <Alert
                  className="query-alert"
                  showIcon
                  type="info"
                  title={t.miner.notFound}
                  description={t.miner.notFoundHint}
                />
              )}
              <div className="metrics-grid">
                <Metric
                  label={t.miner.rate1m}
                  {...hashrateParts(
                    miner.data.hashrate1min,
                    miner.data.hashrateUnit,
                  )}
                  note={t.overview.rateShort}
                  icon={<ThunderboltOutlined />}
                />
                <Metric
                  label={t.miner.rate1d}
                  {...hashrateParts(
                    miner.data.hashrate1d,
                    miner.data.hashrateUnit,
                  )}
                  note={t.overview.rateLong}
                  icon={<ClockCircleOutlined />}
                />
                <Metric
                  label={t.miner.rigs}
                  value={miner.data.rigs.length}
                  unit={t.miner.rigsUnit}
                  note={t.miner.rigsNote}
                  icon={<DesktopOutlined />}
                />
                <Metric
                  label={t.miner.round}
                  value={formatDifficulty(miner.data.roundContrib)}
                  unit="diff"
                  note={t.miner.roundNote}
                  icon={<DatabaseOutlined />}
                />
              </div>
              <Tabs
                key={address}
                items={[
                  {
                    key: "workers",
                    label: t.miner.tabRigs,
                    children: (
                      <div className="stack">
                        <Workers
                          key={address}
                          address={address}
                          rigs={miner.data.rigs}
                        />
                        <RateChart data={miner.data} />
                      </div>
                    ),
                  },
                  {
                    key: "payments",
                    label: t.miner.tabPayments,
                    children: <MinerPayments address={address} />,
                  },
                ]}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
