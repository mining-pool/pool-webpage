import { useState } from "react";
import {
  Alert,
  Card,
  Empty,
  Input,
  Select,
  Steps,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ApiOutlined,
  CheckCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { PageTitle, QueryState } from "../components/Common";
import { useMetadata } from "../lib/queries";
import { site } from "../lib/config";

export default function Connect() {
  const meta = useMetadata();
  const [port, setPort] = useState<string>();
  const [address, setAddress] = useState("");
  const [worker, setWorker] = useState("worker-01");
  const entries = Object.entries(meta.data?.ports ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  const selected = entries.find(([key]) => key === port) ?? entries[0];
  const quantus = meta.data?.algorithm.name.toLowerCase() === "poseidon2";
  const scheme =
    selected &&
    (selected[1].protocol === "quic" || (quantus && !selected[1].protocol))
      ? "quic"
      : selected?.[1].tls
        ? "stratum+ssl"
        : "stratum+tcp";
  const endpoint = selected
    ? `${scheme}://${site.stratumHost}:${selected[0]}`
    : "";
  return (
    <>
      <PageTitle
        eyebrow="GET CONNECTED"
        title="开始挖矿"
        description="准备钱包、选择端口，让你的第一份贡献开始计数。"
      />
      <Card className="steps-card">
        <Steps
          items={[
            {
              title: "准备钱包",
              content: "使用当前币种的收款地址",
              icon: <WalletOutlined />,
            },
            {
              title: "连接矿池",
              content: "填入地址、端口与矿机名",
              icon: <ApiOutlined />,
            },
            {
              title: "查看贡献",
              content: "提交份额后查询矿机",
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>
      <QueryState query={meta} />
      {meta.data && (
        <>
          <div className="overview-grid">
            <Card
              title="矿机连接信息"
              extra={
                <Tag color="green">
                  {meta.data.coin.symbol} · {meta.data.algorithm.name}
                </Tag>
              }
            >
              {!entries.length ? (
                <Empty description="矿池尚未开放挖矿端口" />
              ) : (
                <div className="connection-form">
                  <label htmlFor="connect-port">挖矿端口</label>
                  <Select
                    id="connect-port"
                    value={selected?.[0]}
                    onChange={setPort}
                    options={entries.map(([value, p]) => ({
                      value,
                      label: `${value} · ${p.tls ? "TLS" : "TCP"} · 难度 ${p.diff}`,
                    }))}
                  />
                  <label htmlFor="connect-address">钱包地址</label>
                  <Input
                    id="connect-address"
                    placeholder="填写你的收款地址"
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    maxLength={256}
                  />
                  <label htmlFor="connect-worker">矿机名称</label>
                  <Input
                    id="connect-worker"
                    value={worker}
                    onChange={(e) =>
                      setWorker(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))
                    }
                    maxLength={64}
                  />
                  <div className="connection-output">
                    <div>
                      <span>矿池地址</span>
                      <Typography.Text copyable className="mono">
                        {endpoint}
                      </Typography.Text>
                    </div>
                    <div>
                      <span>矿工标识</span>
                      <Typography.Text copyable className="mono">
                        {address || "YOUR_WALLET_ADDRESS"}.
                        {worker || "worker-01"}
                      </Typography.Text>
                    </div>
                    <div>
                      <span>密码（标准 Stratum）</span>
                      <Typography.Text copyable className="mono">
                        x
                      </Typography.Text>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            <Card title="接入须知">
              <div className="guide-list">
                <div>
                  <span>01</span>
                  <h3>使用正确的收款地址</h3>
                  <p>
                    请使用 {meta.data.coin.name} 的
                    {meta.data.coin.testnet ? "测试网" : "对应网络"}
                    地址。每台矿机使用不同名称，便于识别。
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <h3>选择兼容的挖矿软件</h3>
                  <p>
                    选择支持 {meta.data.algorithm.name}{" "}
                    和矿池端口协议的软件。不同引擎的登录字段、TLS
                    与证书设置可能不同。
                  </p>
                </div>
                <div>
                  <span>03</span>
                  <h3>提交首个有效份额</h3>
                  <p>
                    启动矿机后，用同一钱包地址进入
                    <Link to="/miner">我的矿机</Link>，等待统计刷新。
                  </p>
                </div>
              </div>
            </Card>
          </div>
          {quantus && (
            <Alert
              className="query-alert"
              type="info"
              showIcon
              title="Quantus 接入"
              description="QUIC 端口用于官方矿工；protocol=stratum 的端口用于支持 LuckyPool Quantus 的矿工。原生 QUIC 不使用标准 Stratum 密码，证书指纹及实际启动参数请按仓库 engine/quantus/README.md 配置。"
            />
          )}
          <Card title="可用端口">
            <Table
              rowKey="port"
              pagination={false}
              scroll={{ x: 500 }}
              dataSource={entries.map(([port, value]) => ({ port, ...value }))}
              columns={[
                { title: "端口", dataIndex: "port" },
                {
                  title: "传输",
                  render: (_, p) => (
                    <Tag>
                      {p.protocol === "quic" || (quantus && !p.protocol)
                        ? "QUIC"
                        : p.tls
                          ? "Stratum TLS"
                          : "Stratum TCP"}
                    </Tag>
                  ),
                },
                { title: "初始难度", dataIndex: "diff" },
                {
                  title: "难度模式",
                  render: (_, p) =>
                    p.varDiff
                      ? `动态 · ${p.varDiff.minDiff} – ${p.varDiff.maxDiff}`
                      : "固定难度",
                },
              ]}
            />
          </Card>
        </>
      )}
    </>
  );
}
