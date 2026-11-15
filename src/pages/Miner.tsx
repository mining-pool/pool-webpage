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
import { formatRate, validAddress } from "../lib/format";
import { useMetadata, usePayments } from "../lib/queries";

function MinerPayments({ address }: { address: string }) {
  const payments = usePayments();
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
      title="矿机列表"
      extra={<Tag variant="filled">{rigs.length} 台已记录</Tag>}
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
        locale={{ emptyText: "还没有矿机记录，提交首个份额后即可查看" }}
        columns={[
          {
            title: "矿机名称",
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
            title: "份额活动",
            render: (_, { query }) =>
              query.isError ? (
                <Button
                  size="small"
                  danger
                  onClick={() => void query.refetch()}
                >
                  重试
                </Button>
              ) : (
                <Tag color={query.data?.hashrate1min ? "green" : "default"}>
                  {query.isPending
                    ? "加载中"
                    : query.data?.hashrate1min
                      ? "近 1 分钟有工作量"
                      : "近 1 分钟无工作量"}
                </Tag>
              ),
          },
          {
            title: "1 分钟 · diff/s",
            render: (_, { query }) => formatRate(query.data?.hashrate1min),
          },
          {
            title: "24 小时 · diff/s",
            render: (_, { query }) => formatRate(query.data?.hashrate1d),
          },
        ]}
      />
      <p className="card-subtitle">
        活动状态基于最近份额速率；低算力矿机可能较长时间没有份额，不等同于连接断开。
      </p>
      <Drawer
        open={!!selected}
        onClose={() => setSelected(undefined)}
        title={selected || "矿机详情"}
        size={560}
      >
        <QueryState query={detail} />
        {detail.data && <RateChart data={detail.data} />}
      </Drawer>
    </Card>
  );
}
export default function MinerPage() {
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
        eyebrow="MINER WORKSPACE"
        title="我的矿机"
        description="一个钱包地址，掌握你的工作量、矿机与支付。"
        extra={valid ? <Refresh query={miner} /> : undefined}
      />
      <Card className="search-card">
        <AddressSearch initial={address} />
      </Card>
      {address && !valid && (
        <Alert type="warning" title="地址格式不正确，请重新输入。" showIcon />
      )}
      {!address && (
        <Card className="miner-empty">
          <Empty description="输入挖矿时使用的钱包地址，即可进入矿工工作台" />
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
                <Tag variant="filled">钱包直查</Tag>
              </div>
              {!miner.data.rigs.length && (
                <Alert
                  className="query-alert"
                  showIcon
                  type="info"
                  title="尚未查到此地址的矿机记录"
                  description="请确认连接的是当前矿池，并已提交份额；钱包地址区分大小写。"
                />
              )}
              <div className="metrics-grid">
                <Metric
                  label="工作量 · 1 分钟"
                  value={formatRate(miner.data.hashrate1min)}
                  unit="diff/s"
                  note="短窗口平均难度速率"
                  icon={<ThunderboltOutlined />}
                />
                <Metric
                  label="工作量 · 24 小时"
                  value={formatRate(miner.data.hashrate1d)}
                  unit="diff/s"
                  note="长窗口平均难度速率"
                  icon={<ClockCircleOutlined />}
                />
                <Metric
                  label="累计矿机"
                  value={miner.data.rigs.length}
                  unit="台"
                  note="此地址下已记录的矿机"
                  icon={<DesktopOutlined />}
                />
                <Metric
                  label="本轮贡献"
                  value={formatRate(miner.data.roundContrib)}
                  unit="diff"
                  note="当前轮累计份额难度"
                  icon={<DatabaseOutlined />}
                />
              </div>
              <Tabs
                key={address}
                items={[
                  {
                    key: "workers",
                    label: "矿机与工作量",
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
                    label: "余额与支付",
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
