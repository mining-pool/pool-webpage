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
import { useT } from "../i18n";

export default function Connect() {
  const meta = useMetadata();
  const t = useT();
  const [port, setPort] = useState<string>();
  const [address, setAddress] = useState("");
  const [worker, setWorker] = useState("worker-01");
  const entries = Object.entries(meta.data?.ports ?? {}).sort(
    ([a], [b]) => Number(a) - Number(b),
  );
  const selected = entries.find(([key]) => key === port) ?? entries[0];
  const quantus = meta.data?.algorithm.name.toLowerCase() === "poseidon2";
  const transport = (p: { protocol?: string; tls: boolean }) =>
    p.protocol === "quic" || (quantus && !p.protocol)
      ? "QUIC"
      : p.tls
        ? "Stratum TLS"
        : "Stratum TCP";
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
        eyebrow={t.connect.eyebrow}
        title={t.connect.title}
        description={t.connect.description}
      />
      <Card className="steps-card">
        <Steps
          items={[
            {
              title: t.connect.step1,
              content: t.connect.step1Hint,
              icon: <WalletOutlined />,
            },
            {
              title: t.connect.step2,
              content: t.connect.step2Hint,
              icon: <ApiOutlined />,
            },
            {
              title: t.connect.step3,
              content: t.connect.step3Hint,
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
              title={t.connect.settings}
              extra={
                <Tag color="green">
                  {meta.data.coin.symbol} · {meta.data.algorithm.name}
                </Tag>
              }
            >
              {!entries.length ? (
                <Empty description={t.connect.noPorts} />
              ) : (
                <div className="connection-form">
                  <label htmlFor="connect-port">{t.connect.port}</label>
                  <Select
                    id="connect-port"
                    value={selected?.[0]}
                    onChange={setPort}
                    options={entries.map(([value, p]) => ({
                      value,
                      label: t.connect.portOption(value, transport(p), p.diff),
                    }))}
                  />
                  <label htmlFor="connect-address">{t.connect.address}</label>
                  <Input
                    id="connect-address"
                    placeholder={t.connect.addressPlaceholder}
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    maxLength={256}
                  />
                  <label htmlFor="connect-worker">{t.connect.rig}</label>
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
                      <span>{t.connect.poolUrl}</span>
                      <Typography.Text copyable className="mono">
                        {endpoint}
                      </Typography.Text>
                    </div>
                    <div>
                      <span>{t.connect.login}</span>
                      <Typography.Text copyable className="mono">
                        {address || "YOUR_WALLET_ADDRESS"}.
                        {worker || "worker-01"}
                      </Typography.Text>
                    </div>
                    <div>
                      <span>{t.connect.password}</span>
                      <Typography.Text copyable className="mono">
                        x
                      </Typography.Text>
                    </div>
                  </div>
                </div>
              )}
            </Card>
            <Card title={t.connect.notes}>
              <div className="guide-list">
                <div>
                  <span>01</span>
                  <h3>{t.connect.note1}</h3>
                  <p>
                    {t.connect.note1Body(
                      meta.data.coin.name,
                      !!meta.data.coin.testnet,
                    )}
                  </p>
                </div>
                <div>
                  <span>02</span>
                  <h3>{t.connect.note2}</h3>
                  <p>{t.connect.note2Body(meta.data.algorithm.name)}</p>
                </div>
                <div>
                  <span>03</span>
                  <h3>{t.connect.note3}</h3>
                  <p>
                    {t.connect.note3Body}{" "}
                    <Link to="/miner">{t.connect.note3Link}</Link>{" "}
                    {t.connect.note3After}
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
              title={t.connect.quantus}
              description={t.connect.quantusHint}
            />
          )}
          <Card title={t.connect.ports}>
            <Table
              rowKey="port"
              pagination={false}
              scroll={{ x: 500 }}
              dataSource={entries.map(([port, value]) => ({ port, ...value }))}
              columns={[
                { title: t.connect.portCol, dataIndex: "port" },
                {
                  title: t.connect.transport,
                  render: (_, p) => <Tag>{transport(p)}</Tag>,
                },
                { title: t.connect.diff, dataIndex: "diff" },
                {
                  title: t.connect.diffMode,
                  render: (_, p) =>
                    p.varDiff
                      ? t.connect.varDiff(p.varDiff.minDiff, p.varDiff.maxDiff)
                      : t.connect.fixed,
                },
              ]}
            />
          </Card>
        </>
      )}
    </>
  );
}
