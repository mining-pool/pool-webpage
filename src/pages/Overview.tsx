import { Card, Tag } from "antd";
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  ClusterOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { AddressSearch } from "../components/AddressSearch";
import {
  Metric,
  PageTitle,
  QueryState,
  RateChart,
  Refresh,
} from "../components/Common";
import { useMetadata, usePool } from "../lib/queries";
import { formatRate } from "../lib/format";

export default function Overview() {
  const pool = usePool();
  const meta = useMetadata();
  return (
    <>
      <PageTitle
        eyebrow="POOL OVERVIEW"
        title="矿池概览"
        description="每一份算力，都有迹可循。"
        extra={<Refresh query={pool} />}
      />
      <Card className="lookup-card">
        <h2>查询你的矿机</h2>
        <p className="card-subtitle">
          输入挖矿时使用的钱包地址，即可查看工作量、矿机与支付。无需注册，矿池不公开矿工名单。
        </p>
        <AddressSearch hero />
      </Card>
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
              value={pool.data.minerCount}
              unit="个"
              note="提交过份额的地址数量"
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
        </>
      )}
      <p className="page-note">
        工作量指标按矿池接口原值显示，单位为难度 /
        秒（diff/s）。不等同于设备标称 H/s。
      </p>
    </>
  );
}
