import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Result,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ApiOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AdminAccess } from "../components/AdminAccess";
import { BlocksTable } from "../components/PaymentData";
import {
  Metric,
  PageTitle,
  QueryState,
  RateChart,
  Refresh,
} from "../components/Common";
import { api } from "../lib/api";
import { formatNumber, formatRate, minerPath } from "../lib/format";
import { useMetadata, usePayments, usePool } from "../lib/queries";
import { site } from "../lib/config";
import { useT } from "../i18n";
import PaymentsPage from "./Payments";

function Operations() {
  const pool = usePool(true);
  const meta = useMetadata(true);
  const payments = usePayments(true);
  const t = useT();
  return (
    <>
      <PageTitle
        eyebrow={t.admin.opsEyebrow}
        title={t.admin.opsTitle}
        description={t.admin.opsDescription}
        extra={<Refresh query={pool} />}
      />
      <QueryState query={pool} />
      <div className="metrics-grid">
        <Metric
          label={t.admin.rate1m}
          value={formatRate(pool.data?.hashrate1min)}
          unit="diff/s"
          note={t.admin.rateNote}
          icon={<ThunderboltOutlined />}
        />
        <Metric
          label={t.admin.miners}
          value={pool.data ? formatNumber(pool.data.minerCount) : "—"}
          note={t.admin.minersNote}
          icon={<TeamOutlined />}
        />
        <Metric
          label={t.admin.ports}
          value={meta.data ? Object.keys(meta.data.ports).length : "—"}
          note={t.admin.portsNote}
          icon={<ApiOutlined />}
        />
        <Metric
          label={t.admin.candidates}
          value={payments.data?.unconfirmedCandidates ?? "—"}
          note={t.admin.candidatesNote}
          icon={<DatabaseOutlined />}
        />
      </div>
      <div className="overview-grid">
        {pool.data && <RateChart data={pool.data} />}
        <Card title={t.admin.health}>
          <div className="health-list">
            <div>
              <span>{t.admin.stats}</span>
              <Tag color={pool.isError ? "error" : "green"}>
                {pool.isError ? t.admin.failed : t.admin.ok}
              </Tag>
            </div>
            <div>
              <span>{t.admin.configApi}</span>
              <Tag
                color={meta.isError ? "error" : meta.data ? "green" : "default"}
              >
                {meta.isError
                  ? t.admin.down
                  : meta.data
                    ? t.admin.ok
                    : t.admin.checking}
              </Tag>
            </div>
            <div>
              <span>{t.admin.paymentsApi}</span>
              <Tag
                color={
                  payments.isError
                    ? "error"
                    : payments.data
                      ? "green"
                      : "default"
                }
              >
                {payments.isError
                  ? t.admin.down
                  : payments.data === null
                    ? t.admin.absent
                    : payments.data
                      ? t.admin.offered
                      : t.admin.checking}
              </Tag>
            </div>
            <div>
              <span>{t.admin.paymentsRun}</span>
              <Tag color={payments.data?.fault ? "error" : "default"}>
                {payments.data?.fault
                  ? t.admin.faulted
                  : payments.data?.pending
                    ? t.admin.pending
                    : payments.data
                      ? t.admin.idle
                      : "—"}
              </Tag>
            </div>
          </div>
          <p className="card-subtitle">{t.admin.healthNote}</p>
        </Card>
      </div>
      <QueryState query={meta} />
      <QueryState query={payments} />
      {payments.data?.fault && (
        <Alert
          className="query-alert"
          type="error"
          title={t.admin.fault}
          description={payments.data.fault}
          showIcon
        />
      )}
      <Card
        title={t.admin.blocks}
        extra={<Link to="/admin/payments">{t.admin.checkPayments}</Link>}
      >
        {payments.data ? (
          <BlocksTable data={payments.data} symbol={meta.data?.coin.symbol} />
        ) : (
          <Empty description={t.admin.noBlocks} />
        )}
      </Card>
    </>
  );
}
function Miners() {
  const pool = usePool(true);
  const t = useT();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>();
  const detail = useQuery({
    queryKey: ["admin-miner", selected],
    queryFn: ({ signal }) => api.miner(selected!, true, signal),
    enabled: !!selected,
    refetchInterval: 30000,
  });
  const rows = [...(pool.data?.miners ?? [])]
    .sort()
    .filter((address) => address.includes(search))
    .map((address) => ({ address }));
  return (
    <>
      <PageTitle
        eyebrow={t.admin.minersEyebrow}
        title={t.admin.minersTitle}
        description={t.admin.minersDescription}
        extra={<Refresh query={pool} />}
      />
      <QueryState query={pool} />
      <Card
        title={t.admin.index}
        extra={<Tag>{t.admin.indexCount(rows.length)}</Tag>}
      >
        <Input.Search
          className="table-search"
          placeholder={t.admin.filter}
          aria-label={t.admin.filter}
          allowClear
          onChange={(e) => setSearch(e.target.value.trim())}
        />
        <Table
          rowKey="address"
          key={search}
          dataSource={rows}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          scroll={{ x: 600 }}
          columns={[
            {
              title: t.admin.address,
              dataIndex: "address",
              render: (address: string) => (
                <Typography.Text className="mono" copyable={{ text: address }}>
                  {address}
                </Typography.Text>
              ),
            },
            {
              title: t.admin.kind,
              render: () => <Tag variant="filled">{t.admin.historical}</Tag>,
            },
            {
              title: t.admin.actions,
              dataIndex: "address",
              render: (address: string) => (
                <Button type="link" onClick={() => setSelected(address)}>
                  {t.admin.details}
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        open={!!selected}
        onClose={() => setSelected(undefined)}
        size={600}
        title={t.admin.minerDetail}
      >
        <QueryState query={detail} />
        {detail.data && (
          <div className="stack">
            <Typography.Text className="mono" copyable>
              {selected}
            </Typography.Text>
            <Descriptions
              column={1}
              items={[
                {
                  key: "rigs",
                  label: t.admin.rigs,
                  children: detail.data.rigs.length,
                },
                {
                  key: "round",
                  label: t.admin.round,
                  children: `${formatRate(detail.data.roundContrib)} diff`,
                },
              ]}
            />
            <RateChart data={detail.data} />
            <Link to={minerPath(selected!)}>{t.admin.openMiner}</Link>
          </div>
        )}
      </Drawer>
    </>
  );
}
function Configuration() {
  const meta = useMetadata(true);
  const t = useT();
  return (
    <>
      <PageTitle
        eyebrow={t.admin.configEyebrow}
        title={t.admin.configTitle}
        description={t.admin.configDescription}
        extra={<Refresh query={meta} />}
      />
      <Alert
        className="query-alert"
        type="info"
        showIcon
        title={t.admin.readOnly}
        description={t.admin.readOnlyHint}
      />
      <QueryState query={meta} />
      {meta.data && (
        <div className="stack">
          <Card title={t.admin.basics}>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                {
                  key: "name",
                  label: t.admin.coin,
                  children: meta.data.coin.name,
                },
                {
                  key: "symbol",
                  label: t.admin.symbol,
                  children: meta.data.coin.symbol,
                },
                {
                  key: "algorithm",
                  label: t.admin.algorithm,
                  children: meta.data.algorithm.name,
                },
                {
                  key: "network",
                  label: t.admin.testnet,
                  children: meta.data.coin.testnet
                    ? t.common.yes
                    : t.admin.testnetNo,
                },
                {
                  key: "multiplier",
                  label: t.admin.multiplier,
                  children:
                    meta.data.algorithm.multiplier ?? t.admin.undeclared,
                },
                {
                  key: "host",
                  label: t.admin.stratumHost,
                  children: site.stratumHost,
                },
              ]}
            />
          </Card>
          <Card title={t.admin.portConfig}>
            <Table
              rowKey="port"
              pagination={false}
              scroll={{ x: 600 }}
              dataSource={Object.entries(meta.data.ports).map(
                ([port, value]) => ({ port, ...value }),
              )}
              columns={[
                { title: t.connect.portCol, dataIndex: "port" },
                {
                  title: t.admin.protocol,
                  dataIndex: "protocol",
                  render: (value?: string) => value || t.admin.engineDefault,
                },
                { title: t.connect.diff, dataIndex: "diff" },
                {
                  title: t.admin.tls,
                  dataIndex: "tls",
                  render: (value: boolean) => (
                    <Tag color={value ? "green" : "default"}>
                      {value ? t.admin.tlsOn : t.admin.tlsOff}
                    </Tag>
                  ),
                },
                {
                  title: t.admin.varDiff,
                  render: (_, value) =>
                    value.varDiff
                      ? `${value.varDiff.minDiff} – ${value.varDiff.maxDiff}`
                      : t.admin.varDiffOff,
                },
              ]}
            />
          </Card>
        </div>
      )}
    </>
  );
}
function AdminRoutes() {
  const t = useT();
  return (
    <>
      {site.demo && (
        <Alert
          className="query-alert"
          type="warning"
          showIcon
          title={t.admin.demoBanner}
          description={t.admin.demoBannerHint}
        />
      )}
      <Routes>
        <Route path="login" element={<Navigate to="/admin" replace />} />
        <Route index element={<Operations />} />
        <Route path="miners" element={<Miners />} />
        <Route path="payments" element={<PaymentsPage admin />} />
        <Route path="config" element={<Configuration />} />
        <Route
          path="*"
          element={
            <Result
              status="404"
              title={t.admin.notFound}
              extra={<Link to="/admin">{t.admin.backToOps}</Link>}
            />
          }
        />
      </Routes>
    </>
  );
}

export default function Admin() {
  return site.demo ? (
    <AdminRoutes />
  ) : (
    <AdminAccess>
      <AdminRoutes />
    </AdminAccess>
  );
}
