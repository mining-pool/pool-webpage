import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "antd";
import {
  CloseCircleOutlined,
  MoonOutlined,
  SunOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { site } from "../../lib/config";
import { formatRate } from "../../lib/format";
import { useMetadata, usePool } from "../../lib/queries";
import { useTheme } from "../../lib/theme";

export function StatusBar({
  problems,
  onProblems,
  onPalette,
}: {
  problems: number;
  onProblems: () => void;
  onPalette: () => void;
}) {
  const pool = usePool();
  const meta = useMetadata();
  // Observe the payments cache without polling it from every page.
  const payments = useQuery({
    queryKey: ["payments", false],
    queryFn: ({ signal }) => api.payments(false, signal),
    enabled: false,
  });
  const { mode, toggle } = useTheme();
  const online = !pool.isError && !!pool.data;
  return (
    <footer className="statusbar" aria-label="状态栏">
      <div className="status-left">
        <button
          type="button"
          className="status-item remote"
          onClick={onPalette}
          aria-label="打开命令面板"
        >
          <ThunderboltOutlined /> NOMP
        </button>
        <span
          className={`status-item ${site.demo ? "warn" : online ? "" : "error"}`}
        >
          <span className="status-dot" />
          {site.demo
            ? "演示数据"
            : online
              ? "实时接口"
              : pool.isError
                ? "接口不可用"
                : "连接中"}
        </span>
        <button
          type="button"
          className="status-item"
          onClick={onProblems}
          aria-label={`${problems} 个问题`}
        >
          <CloseCircleOutlined /> {problems}
        </button>
      </div>
      <div className="status-right">
        {pool.data && (
          <Tooltip title="矿池 1 分钟窗口平均难度速率">
            <span className="status-item">
              1m {formatRate(pool.data.hashrate1min)} diff/s
            </span>
          </Tooltip>
        )}
        {payments.data && (
          <span className="status-item">
            高度 {payments.data.finalizedHeight.toLocaleString()}
          </span>
        )}
        {meta.data && (
          <span className="status-item">
            {meta.data.coin.symbol} · {meta.data.algorithm.name}
          </span>
        )}
        <span className="status-item">
          <SyncOutlined spin={pool.isFetching} />
          {pool.dataUpdatedAt
            ? new Date(pool.dataUpdatedAt).toLocaleTimeString("zh-CN", {
                hour12: false,
              })
            : "—"}
        </span>
        <Tooltip title={mode === "dark" ? "切换到浅色主题" : "切换到深色主题"}>
          <button
            type="button"
            className="status-item"
            onClick={toggle}
            aria-label="切换主题"
          >
            {mode === "dark" ? <MoonOutlined /> : <SunOutlined />}
          </button>
        </Tooltip>
      </div>
    </footer>
  );
}
