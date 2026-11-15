import { Card, Empty, Skeleton, Tag } from "antd";
import {
  ApiOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { AddressSearch } from "../components/AddressSearch";
import { CodeBlock } from "../components/CodeBlock";
import {
  Metric,
  PageTitle,
  QueryState,
  RateChart,
  Refresh,
} from "../components/Common";
import { useMetadata, usePool } from "../lib/queries";
import { formatRate, minerPath, shorten } from "../lib/format";
import { useRecentAddresses } from "../lib/recent";
import { site } from "../lib/config";

export default function Overview() {
  const pool = usePool();
  const meta = useMetadata();
  const recent = useRecentAddresses();
  return (
    <>
      <PageTitle
        eyebrow="POOL OVERVIEW"
        title="矿池概览"
        description="每一份算力，都有迹可循。"
        extra={<Refresh query={pool} />}
      />
      <section className="welcome">
        <div className="welcome-main">
          <h2 className="welcome-title">{site.name}</h2>
          <p className="welcome-sub">
            Not Only Mining Pool · 使用钱包地址，即刻查看矿机状态与挖矿数据。
          </p>
          <AddressSearch hero />
          <div className="welcome-columns">
            <div>
              <h3>开始</h3>
              <Link to="/miner">
                <DesktopOutlined /> 查询我的矿机…
              </Link>
              <Link to="/connect">
                <ApiOutlined /> 连接矿机，开始挖矿…
              </Link>
              <Link to="/payments">
                <WalletOutlined /> 查看支付记录…
              </Link>
            </div>
            <div>
              <h3>最近</h3>
              {recent.length ? (
                recent.slice(0, 5).map((address) => (
                  <Link key={address} to={minerPath(address)} title={address}>
                    <span className="mono">{shorten(address)}</span>
                  </Link>
                ))
              ) : (
                <p className="muted">
                  查询时勾选“在此设备记住地址”，最近使用的地址会出现在这里。
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="welcome-code">
          {pool.data || meta.data ? (
            <CodeBlock
              filename="pool.json"
              comment="GET /api/pool · /api/config — 实时接口返回值"
              value={{
                coin: meta.data?.coin.name ?? pool.data?.coinName,
                symbol: meta.data?.coin.symbol,
                algorithm: meta.data?.algorithm.name,
                testnet: meta.data?.coin.testnet ?? false,
                ports: meta.data
                  ? Object.keys(meta.data.ports)
                      .map(Number)
                      .sort((a, b) => a - b)
                  : [],
                miners: pool.data?.miners.length,
                "diff/s": pool.data && {
                  "1m": pool.data.hashrate1min,
                  "24h": pool.data.hashrate1d,
                },
              }}
            />
          ) : (
            <Card>
              <Skeleton active paragraph={{ rows: 6 }} />
            </Card>
          )}
        </div>
      </section>
      <QueryState query={pool} />
      {pool.data && (
        <>
          <div className="metrics-grid">
            <Metric
              label="矿池工作量 · 1 分钟"
              value={formatRate(pool.data.hashrate1min)}
              unit="diff/s"
              note="短窗口平均难度速率"
              icon={<ThunderboltOutlined />}
            />
            <Metric
              label="矿池工作量 · 24 小时"
              value={formatRate(pool.data.hashrate1d)}
              unit="diff/s"
              note="长窗口平均难度速率"
              icon={<ClockCircleOutlined />}
            />
            <Metric
              label="累计矿工"
              value={pool.data.miners.length}
              unit="个"
              note="已记录的矿工地址"
              icon={<TeamOutlined />}
            />
            <Metric
              label="当前算法"
              value={meta.data?.algorithm.name ?? "—"}
              note={
                meta.data
                  ? `${meta.data.coin.name} / ${meta.data.coin.symbol}`
                  : "等待矿池配置"
              }
              icon={<ClusterOutlined />}
            />
          </div>
          <div className="overview-grid">
            <RateChart data={pool.data} />
            <Card
              title="矿池信息"
              extra={
                meta.data?.coin.testnet ? (
                  <Tag color="orange">测试网络</Tag>
                ) : null
              }
            >
              <QueryState query={meta} />
              {meta.data && (
                <div className="info-list">
                  <div>
                    <span>挖矿币种</span>
                    <strong>
                      {meta.data.coin.name}
                      <Tag>{meta.data.coin.symbol}</Tag>
                    </strong>
                  </div>
                  <div>
                    <span>工作量证明</span>
                    <strong>{meta.data.algorithm.name}</strong>
                  </div>
                  <div>
                    <span>开放端口</span>
                    <strong>{Object.keys(meta.data.ports).length} 个</strong>
                  </div>
                  <div>
                    <span>统计更新</span>
                    <strong>每 30 秒</strong>
                  </div>
                  <div>
                    <span>加入方式</span>
                    <strong>钱包地址直连</strong>
                  </div>
                </div>
              )}
              <Link to="/connect" className="connect-cta">
                <ArrowRightOutlined /> 查看接入指南
              </Link>
            </Card>
          </div>
          <Card
            title="矿工索引"
            extra={
              <Link to="/miner">
                查询我的矿机 <ArrowRightOutlined />
              </Link>
            }
          >
            <p className="card-subtitle">
              已向矿池提交过份额的地址，按名称排序；不代表当前在线状态。
            </p>
            {pool.data.miners.length ? (
              <div className="miner-list">
                {[...pool.data.miners]
                  .sort()
                  .slice(0, 5)
                  .map((address, i) => (
                    <Link key={address} to={minerPath(address)}>
                      <span className="miner-rank">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="wallet-symbol">W</span>
                      <span className="mono" title={address}>
                        {shorten(address)}
                      </span>
                      <Tag variant="filled">已记录</Tag>
                      <ArrowRightOutlined />
                    </Link>
                  ))}
              </div>
            ) : (
              <Empty description="还没有矿工提交份额" />
            )}
          </Card>
        </>
      )}
      <p className="page-note">
        工作量指标按矿池接口原值显示，单位为难度 /
        秒（diff/s）。不等同于设备标称 H/s。
      </p>
    </>
  );
}
