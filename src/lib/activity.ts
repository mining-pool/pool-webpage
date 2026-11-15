import { useEffect, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";

export type LogEntry = {
  id: number;
  time: number;
  level: "info" | "error";
  source: string;
  message: string;
};

export type Problem = { key: string; source: string; message: string };

/** Human-readable endpoint for a query key, used by the output panel. */
export function describeQuery(key: QueryKey): string {
  const [name, arg, extra] = key as unknown[];
  const base = arg === true ? "/admin-api" : "/api";
  switch (name) {
    case "pool":
      return `GET ${base}/pool`;
    case "metadata":
      return `GET ${base}/config/{coin,algorithm,ports}`;
    case "payments":
      return `GET ${base}/payments`;
    case "miner":
      return `GET /api/miner/${String(arg)}`;
    case "admin-miner":
      return `GET /admin-api/miner/${String(arg)}`;
    case "rig":
      return `GET /api/miner/${String(arg)}/rig/${String(extra)}`;
    case "admin-session":
      return "GET /admin-api/auth/session";
    default:
      return key.map(String).join(" ");
  }
}

const limit = 300;
let sequence = 0;

/**
 * Mirrors TanStack Query cache activity into an editor-style output log and a
 * problems list. Nothing is fabricated: entries only come from real fetches.
 */
export function useActivity() {
  const client = useQueryClient();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  useEffect(() => {
    const cache = client.getQueryCache();
    const collect = () =>
      setProblems(
        cache
          .findAll()
          .filter((q) => q.state.status === "error" && q.getObserversCount())
          .map((q) => ({
            key: q.queryHash,
            source: describeQuery(q.queryKey),
            message: q.state.error?.message ?? "未知错误",
          })),
      );
    collect();
    return cache.subscribe((event) => {
      if (event.type === "observerRemoved" || event.type === "removed") {
        collect();
        return;
      }
      if (event.type !== "updated") return;
      const action = event.action;
      if (action.type !== "success" && action.type !== "error") return;
      collect();
      if (action.type === "error" && action.error?.name === "AbortError")
        return;
      const entry: LogEntry = {
        id: ++sequence,
        time: Date.now(),
        level: action.type === "success" ? "info" : "error",
        source: describeQuery(event.query.queryKey),
        message:
          action.type === "success"
            ? "ok"
            : (action.error?.message ?? "请求失败"),
      };
      setLog((current) => [...current.slice(-(limit - 1)), entry]);
    });
  }, [client]);
  return { log, problems, clear: () => setLog([]) };
}
