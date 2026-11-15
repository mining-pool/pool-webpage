import { useEffect, useRef } from "react";
import { Tooltip } from "antd";
import {
  CloseCircleOutlined,
  CloseOutlined,
  StopOutlined,
} from "@ant-design/icons";
import type { LogEntry, Problem } from "../../lib/activity";

export type PanelTab = "problems" | "output";

const time = (value: number) =>
  new Date(value).toLocaleTimeString("zh-CN", { hour12: false });

export function Panel({
  tab,
  onTab,
  onClose,
  log,
  problems,
  onClear,
}: {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onClose: () => void;
  log: LogEntry[];
  problems: Problem[];
  onClear: () => void;
}) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tab === "output") end.current?.scrollIntoView({ block: "end" });
  }, [log, tab]);
  return (
    <section className="panel" aria-label="面板">
      <div className="panel-header">
        <div className="panel-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "problems"}
            className={tab === "problems" ? "active" : ""}
            onClick={() => onTab("problems")}
          >
            问题
            {!!problems.length && (
              <span className="badge">{problems.length}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "output"}
            className={tab === "output" ? "active" : ""}
            onClick={() => onTab("output")}
          >
            输出
          </button>
        </div>
        <div className="panel-actions">
          {tab === "output" && (
            <Tooltip title="清除输出">
              <button type="button" aria-label="清除输出" onClick={onClear}>
                <StopOutlined />
              </button>
            </Tooltip>
          )}
          <Tooltip title="关闭面板 (Ctrl+J)">
            <button type="button" aria-label="关闭面板" onClick={onClose}>
              <CloseOutlined />
            </button>
          </Tooltip>
        </div>
      </div>
      <div className="panel-body" role="tabpanel">
        {tab === "problems" ? (
          problems.length ? (
            problems.map((problem) => (
              <div key={problem.key} className="problem">
                <CloseCircleOutlined />
                <span>{problem.message}</span>
                <span className="muted">{problem.source}</span>
              </div>
            ))
          ) : (
            <p className="muted">未在工作区检测到问题。</p>
          )
        ) : (
          <div className="output" aria-live="off">
            {log.length ? (
              log.map((entry) => (
                <div key={entry.id} className={`log ${entry.level}`}>
                  <span className="log-time">{time(entry.time)}</span>
                  <span className="log-level">
                    [{entry.level === "info" ? "info" : "error"}]
                  </span>
                  <span className="log-source">{entry.source}</span>
                  <span className="log-message">{entry.message}</span>
                </div>
              ))
            ) : (
              <p className="muted">等待接口请求…</p>
            )}
            <div ref={end} />
          </div>
        )}
      </div>
    </section>
  );
}
