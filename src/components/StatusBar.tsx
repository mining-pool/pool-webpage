import { Tooltip } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { site } from "../lib/config";
import { formatHashrate, formatTime } from "../lib/format";
import { useT } from "../i18n";
import { useMetadata, usePool } from "../lib/queries";

export function StatusBar() {
  const pool = usePool();
  const meta = useMetadata();
  const t = useT();
  const state = site.demo
    ? { label: t.status.demo, tone: "warn" }
    : pool.isError
      ? { label: t.status.down, tone: "error" }
      : pool.data
        ? { label: t.status.live, tone: "ok" }
        : { label: t.status.connecting, tone: "" };
  return (
    <footer className="statusbar" aria-label={t.status.label}>
      <div className="status-group">
        <span className={`status-item ${state.tone}`} role="status">
          <span className="status-dot" aria-hidden="true" />
          {state.label}
        </span>
        {meta.data && (
          <span className="status-item">
            {meta.data.coin.symbol} · {meta.data.algorithm.name}
          </span>
        )}
      </div>
      <div className="status-group">
        {pool.data && (
          <Tooltip title={t.status.rateHint}>
            <span className="status-item">
              {formatHashrate(pool.data.hashrate1min, pool.data.hashrateUnit)}
            </span>
          </Tooltip>
        )}
        <span className="status-item">
          <SyncOutlined spin={pool.isFetching} aria-hidden="true" />
          {pool.dataUpdatedAt ? formatTime(pool.dataUpdatedAt) : "—"}
        </span>
      </div>
    </footer>
  );
}
