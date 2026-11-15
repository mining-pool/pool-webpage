import { shorten } from "./format";

export type PageKind =
  "overview" | "miner" | "payments" | "connect" | "admin" | "missing";

export type PageInfo = {
  path: string;
  title: string;
  /** File-like name shown in tabs and breadcrumbs, as in an editor. */
  file: string;
  kind: PageKind;
  crumbs: string[];
};

const fixed: Record<string, Omit<PageInfo, "path">> = {
  "/": {
    title: "矿池概览",
    file: "overview.dash",
    kind: "overview",
    crumbs: ["pool", "overview.dash"],
  },
  "/miner": {
    title: "我的矿机",
    file: "lookup.miner",
    kind: "miner",
    crumbs: ["pool", "miner", "lookup.miner"],
  },
  "/payments": {
    title: "支付记录",
    file: "payments.ledger",
    kind: "payments",
    crumbs: ["pool", "payments.ledger"],
  },
  "/connect": {
    title: "开始挖矿",
    file: "connect.md",
    kind: "connect",
    crumbs: ["pool", "connect.md"],
  },
  "/admin": {
    title: "运行概览",
    file: "operations.ops",
    kind: "admin",
    crumbs: ["admin", "operations.ops"],
  },
  "/admin/miners": {
    title: "矿工管理",
    file: "miners.ops",
    kind: "admin",
    crumbs: ["admin", "miners.ops"],
  },
  "/admin/payments": {
    title: "支付监控",
    file: "payments.ops",
    kind: "admin",
    crumbs: ["admin", "payments.ops"],
  },
  "/admin/config": {
    title: "矿池配置",
    file: "config.json",
    kind: "admin",
    crumbs: ["admin", "config.json"],
  },
};

export const explorerPages = {
  pool: ["/", "/miner", "/payments", "/connect"],
  admin: ["/admin", "/admin/miners", "/admin/payments", "/admin/config"],
};

export function normalizePath(pathname: string) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed || "/";
}

export function pageInfo(pathname: string): PageInfo {
  const path = normalizePath(pathname);
  if (fixed[path]) return { path, ...fixed[path] };
  const miner = /^\/miner\/([^/]+)$/.exec(path);
  if (miner) {
    let address = miner[1];
    try {
      address = decodeURIComponent(address);
    } catch {
      /* keep the raw segment */
    }
    return {
      path,
      title: shorten(address),
      file: `${shorten(address)}.miner`,
      kind: "miner",
      crumbs: ["pool", "miner", shorten(address)],
    };
  }
  return {
    path,
    title: "页面不存在",
    file: "404",
    kind: "missing",
    crumbs: ["pool", "404"],
  };
}
