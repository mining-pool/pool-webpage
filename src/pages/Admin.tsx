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
import { formatRate, minerPath } from "../lib/format";
import { useMetadata, usePayments, usePool } from "../lib/queries";
import { site } from "../lib/config";
import PaymentsPage from "./Payments";

function Operations() {
  const pool = usePool(true);
  const meta = useMetadata(true);
  const payments = usePayments(true);
  return (
    <>
      <PageTitle
        eyebrow="OPERATIONS CENTER"
        title="运行概览"
        description="集中查看矿池工作量、接入配置和支付处理状态。"
        extra={<Refresh query={pool} />}
      />
      <QueryState query={pool} />
      <div className="metrics-grid">
        <Metric
          label="矿池工作量 · 1 分钟"
          value={formatRate(pool.data?.hashrate1min)}
          unit="diff/s"
          note="接口返回的难度速率"
          icon={<ThunderboltOutlined />}
        />
        <Metric
          label="累计矿工"
          value={pool.data?.miners.length ?? "—"}
          unit="个"
          note="历史份额提交地址"
          icon={<TeamOutlined />}
        />
        <Metric
          label="挖矿端口"
          value={meta.data ? Object.keys(meta.data.ports).length : "—"}
          unit="个"
          note="当前已加载的端口配置"
          icon={<ApiOutlined />}
        />
        <Metric
          label="待确认候选"
          value={payments.data?.unconfirmedCandidates ?? "—"}
          unit="个"
          note="支付接口提供的区块候选数量"
          icon={<DatabaseOutlined />}
        />
      </div>
      <div className="overview-grid">
        {pool.data && <RateChart data={pool.data} />}
        <Card title="接口与支付状态">
          <div className="health-list">
            <div>
              <span>矿池统计</span>
              <Tag color={pool.isError ? "error" : "green"}>
                {pool.isError ? "更新失败" : "可访问"}
              </Tag>
            </div>
            <div>
              <span>币种与端口配置</span>
              <Tag
                color={meta.isError ? "error" : meta.data ? "green" : "default"}
              >
                {meta.isError ? "不可用" : meta.data ? "可访问" : "检查中"}
              </Tag>
            </div>
            <div>
              <span>支付查询</span>
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
                  ? "不可用"
                  : payments.data === null
                    ? "未提供"
                    : payments.data
                      ? "已提供"
                      : "检查中"}
              </Tag>
            </div>
            <div>
              <span>支付处理</span>
              <Tag color={payments.data?.fault ? "error" : "default"}>
                {payments.data?.fault
                  ? "异常"
                  : payments.data?.pending
                    ? "待确认"
                    : payments.data
                      ? "无待处理交易"
                      : "—"}
              </Tag>
            </div>
          </div>
          <p className="card-subtitle">
            接口可访问不代表节点、Redis 或 Stratum 连接全部健康。
          </p>
        </Card>
      </div>
      <QueryState query={meta} />
      <QueryState query={payments} />
      {payments.data?.fault && (
        <Alert
          className="query-alert"
          type="error"
          title="支付故障"
          description={payments.data.fault}
          showIcon
        />
      )}
      <Card
        title="最近结算区块"
        extra={<Link to="/admin/payments">检查支付 →</Link>}
      >
        {payments.data ? (
          <BlocksTable data={payments.data} symbol={meta.data?.coin.symbol} />
        ) : (
          <Empty description="当前没有可展示的结算区块数据" />
        )}
      </Card>
    </>
  );
}
function Miners() {
  const pool = usePool(true);
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
        eyebrow="MINER DIRECTORY"
        title="矿工管理"
        description="检索历史矿工索引，检查单个地址的矿机与本轮贡献。"
        extra={<Refresh query={pool} />}
      />
      <QueryState query={pool} />
      <Card title="矿工索引" extra={<Tag>{rows.length} 个地址</Tag>}>
        <Input.Search
          className="table-search"
          placeholder="按钱包地址筛选（区分大小写）"
          aria-label="筛选矿工"
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
              title: "钱包地址",
              dataIndex: "address",
              render: (address: string) => (
                <Typography.Text className="mono" copyable={{ text: address }}>
                  {address}
                </Typography.Text>
              ),
            },
            {
              title: "记录类型",
              render: () => <Tag variant="filled">历史矿工</Tag>,
            },
            {
              title: "操作",
              dataIndex: "address",
              render: (address: string) => (
                <Button type="link" onClick={() => setSelected(address)}>
                  查看详情
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
        title="矿工详情"
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
                  label: "累计矿机",
                  children: detail.data.rigs.length,
                },
                {
                  key: "round",
                  label: "本轮贡献",
                  children: `${formatRate(detail.data.roundContrib)} diff`,
                },
              ]}
            />
            <RateChart data={detail.data} />
            <Link to={minerPath(selected!)}>打开矿工工作台 →</Link>
          </div>
        )}
      </Drawer>
    </>
  );
}
function Configuration() {
  const meta = useMetadata(true);
  return (
    <>
      <PageTitle
        eyebrow="POOL CONFIGURATION"
        title="矿池配置"
        description="检查当前矿池已加载的币种、算法与端口设置。"
        extra={<Refresh query={meta} />}
      />
      <Alert
        className="query-alert"
        type="info"
        showIcon
        title="配置只读"
        description="修改配置需要在服务器上编辑矿池配置文件并按运维流程重启实例。当前后端没有配置写入接口。"
      />
      <QueryState query={meta} />
      {meta.data && (
        <div className="stack">
          <Card title="基本信息">
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              items={[
                { key: "name", label: "币种", children: meta.data.coin.name },
                {
                  key: "symbol",
                  label: "符号",
                  children: meta.data.coin.symbol,
                },
                {
                  key: "algorithm",
                  label: "算法",
                  children: meta.data.algorithm.name,
                },
                {
                  key: "network",
                  label: "测试网络",
                  children: meta.data.coin.testnet ? "是" : "否 / 未声明",
                },
                {
                  key: "multiplier",
                  label: "算法倍率",
                  children: meta.data.algorithm.multiplier ?? "未声明",
                },
                {
                  key: "host",
                  label: "前端展示的挖矿域名",
                  children: site.stratumHost,
                },
              ]}
            />
          </Card>
          <Card title="端口配置">
            <Table
              rowKey="port"
              pagination={false}
              scroll={{ x: 600 }}
              dataSource={Object.entries(meta.data.ports).map(
                ([port, value]) => ({ port, ...value }),
              )}
              columns={[
                { title: "端口", dataIndex: "port" },
                {
                  title: "协议声明",
                  dataIndex: "protocol",
                  render: (value?: string) => value || "引擎默认",
                },
                { title: "初始难度", dataIndex: "diff" },
                {
                  title: "TLS",
                  dataIndex: "tls",
                  render: (value: boolean) => (
                    <Tag color={value ? "green" : "default"}>
                      {value ? "启用" : "未配置"}
                    </Tag>
                  ),
                },
                {
                  title: "动态难度",
                  render: (_, value) =>
                    value.varDiff
                      ? `${value.varDiff.minDiff} – ${value.varDiff.maxDiff}`
                      : "未启用",
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
  return (
    <>
      {site.demo && (
        <Alert
          className="query-alert"
          type="warning"
          showIcon
          title="演示管理台 · 数据仅用于界面预览"
          description="真实管理台需要使用 Go 后端配置的管理员账号登录。"
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
              title="管理页面不存在"
              extra={<Link to="/admin">返回运行概览</Link>}
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
