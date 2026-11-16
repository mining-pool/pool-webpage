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
import { formatNumber, formatRate } from "../lib/format";
import { useT } from "../i18n";

export default function Overview() {
  const pool = usePool();
  const meta = useMetadata();
  const t = useT();
  return (
    <>
      <PageTitle
        eyebrow={t.overview.eyebrow}
        title={t.overview.title}
        description={t.overview.description}
        extra={<Refresh query={pool} />}
      />
      <Card className="lookup-card">
        <h2>{t.overview.lookupTitle}</h2>
        <p className="card-subtitle">{t.overview.lookupHint}</p>
        <AddressSearch hero />
      </Card>
      <QueryState query={pool} />
      {pool.data && (
        <>
          <div className="metrics-grid">
            <Metric
              label={t.overview.rate1m}
              value={formatRate(pool.data.hashrate1min)}
              unit="diff/s"
              note={t.overview.rateShort}
              icon={<ThunderboltOutlined />}
            />
            <Metric
              label={t.overview.rate1d}
              value={formatRate(pool.data.hashrate1d)}
              unit="diff/s"
              note={t.overview.rateLong}
              icon={<ClockCircleOutlined />}
            />
            <Metric
              label={t.overview.miners}
              value={formatNumber(pool.data.minerCount)}
              unit={t.overview.minersUnit}
              note={t.overview.minersNote}
              icon={<TeamOutlined />}
            />
            <Metric
              label={t.overview.algorithm}
              value={meta.data?.algorithm.name ?? "—"}
              note={
                meta.data
                  ? `${meta.data.coin.name} / ${meta.data.coin.symbol}`
                  : t.overview.awaitingConfig
              }
              icon={<ClusterOutlined />}
            />
          </div>
          <div className="overview-grid">
            <RateChart data={pool.data} />
            <Card
              title={t.overview.info}
              extra={
                meta.data?.coin.testnet ? (
                  <Tag color="orange">{t.overview.testnet}</Tag>
                ) : null
              }
            >
              <QueryState query={meta} />
              {meta.data && (
                <div className="info-list">
                  <div>
                    <span>{t.overview.coin}</span>
                    <strong>
                      {meta.data.coin.name}
                      <Tag>{meta.data.coin.symbol}</Tag>
                    </strong>
                  </div>
                  <div>
                    <span>{t.overview.pow}</span>
                    <strong>{meta.data.algorithm.name}</strong>
                  </div>
                  <div>
                    <span>{t.overview.ports}</span>
                    <strong>
                      {t.overview.portCount(
                        Object.keys(meta.data.ports).length,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>{t.overview.refresh}</span>
                    <strong>{t.overview.refreshEvery}</strong>
                  </div>
                  <div>
                    <span>{t.overview.join}</span>
                    <strong>{t.overview.joinValue}</strong>
                  </div>
                </div>
              )}
              <Link to="/connect" className="connect-cta">
                <ArrowRightOutlined /> {t.overview.guide}
              </Link>
            </Card>
          </div>
        </>
      )}
      <p className="page-note">{t.rates.note}</p>
    </>
  );
}
