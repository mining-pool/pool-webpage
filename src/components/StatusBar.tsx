import { Tooltip } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { site } from "../lib/config";
import { formatRate } from "../lib/format";
import { useMetadata, usePool } from "../lib/queries";

export function StatusBar() {
  const pool = usePool();
  const meta = useMetadata();
  const state = site.demo
    ? { label: "演示数据", tone: "warn" }
    : pool.isError
      ? { label: "接口不可用", tone: "error" }
      : pool.data
        ? { label: "实时接口", tone: "ok" }
        : { label: "连接中", tone: "" };
  return (
    <footer className="statusbar" aria-label="矿池状态">
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
          <Tooltip title="矿池 1 分钟窗口平均难度速率">
            <span className="status-item">
              {formatRate(pool.data.hashrate1min)} diff/s
            </span>
          </Tooltip>
        )}
        <span className="status-item">
          <SyncOutlined spin={pool.isFetching} aria-hidden="true" />
          {pool.dataUpdatedAt
            ? new Date(pool.dataUpdatedAt).toLocaleTimeString("zh-CN", {
                hour12: false,
              })
            : "—"}
        </span>
      </div>
    </footer>
  );
}
