import { useState, type ReactNode } from "react";
import { Tooltip } from "antd";
import {
  ClearOutlined,
  DownOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { NavLink, useNavigate } from "react-router-dom";
import { explorerPages, pageInfo } from "../../lib/routes";
import { minerPath, shorten, validAddress } from "../../lib/format";
import { clearRecentAddresses, useRecentAddresses } from "../../lib/recent";
import { useMetadata, usePool } from "../../lib/queries";
import { site } from "../../lib/config";
import { FileIcon } from "./FileIcon";

export type View = "explorer" | "search" | "admin";

function Section({
  title,
  actions,
  children,
  defaultOpen = true,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`pane ${open ? "open" : ""}`}>
      <div className="pane-header">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <DownOutlined /> : <RightOutlined />}
          <span>{title}</span>
        </button>
        {open && actions && <div className="pane-actions">{actions}</div>}
      </div>
      {open && <div className="pane-body">{children}</div>}
    </section>
  );
}

function TreeLink({
  path,
  depth = 1,
  onNavigate,
}: {
  path: string;
  depth?: number;
  onNavigate: () => void;
}) {
  const page = pageInfo(path);
  return (
    <NavLink
      to={path}
      end
      onClick={onNavigate}
      className={({ isActive }) => `tree-item ${isActive ? "active" : ""}`}
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <FileIcon page={page} />
      <span className="tree-label">{page.title}</span>
      <span className="tree-hint">{page.file}</span>
    </NavLink>
  );
}

function Folder({ name, children }: { name: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        className="tree-item folder"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{ paddingLeft: 8 }}
      >
        {open ? <DownOutlined /> : <RightOutlined />}
        <span className="tree-label">{name}</span>
      </button>
      {open && children}
    </>
  );
}

function RecentList({ onNavigate }: { onNavigate: () => void }) {
  const recent = useRecentAddresses();
  if (!recent.length)
    return (
      <p className="pane-empty">
        勾选“在此设备记住地址”后，查询过的地址会显示在这里。
      </p>
    );
  return (
    <>
      {recent.map((address) => (
        <NavLink
          key={address}
          to={minerPath(address)}
          onClick={onNavigate}
          title={address}
          className={({ isActive }) => `tree-item ${isActive ? "active" : ""}`}
          style={{ paddingLeft: 20 }}
        >
          <FileIcon page={{ path: "", kind: "miner" }} />
          <span className="tree-label mono">{shorten(address)}</span>
        </NavLink>
      ))}
    </>
  );
}

function Explorer({ onNavigate }: { onNavigate: () => void }) {
  const meta = useMetadata();
  return (
    <>
      <Section title={site.name}>
        <Folder name="pool">
          {explorerPages.pool.map((path) => (
            <TreeLink key={path} path={path} onNavigate={onNavigate} />
          ))}
        </Folder>
        <Folder name="admin">
          {explorerPages.admin.map((path) => (
            <TreeLink key={path} path={path} onNavigate={onNavigate} />
          ))}
        </Folder>
      </Section>
      <Section
        title="最近查询"
        actions={
          <Tooltip title="清除本机记录">
            <button
              type="button"
              aria-label="清除最近查询"
              onClick={clearRecentAddresses}
            >
              <ClearOutlined />
            </button>
          </Tooltip>
        }
      >
        <RecentList onNavigate={onNavigate} />
      </Section>
      <Section title="大纲">
        {meta.data ? (
          <dl className="outline">
            <dt>coin</dt>
            <dd>
              {meta.data.coin.name} <em>{meta.data.coin.symbol}</em>
            </dd>
            <dt>algorithm</dt>
            <dd>{meta.data.algorithm.name}</dd>
            <dt>network</dt>
            <dd>{meta.data.coin.testnet ? "testnet" : "mainnet / 未声明"}</dd>
            <dt>ports</dt>
            <dd>{Object.keys(meta.data.ports).sort().join(", ") || "—"}</dd>
          </dl>
        ) : (
          <p className="pane-empty">
            {meta.isError ? "无法读取矿池配置" : "正在读取矿池配置…"}
          </p>
        )}
      </Section>
    </>
  );
}

function Search({ onNavigate }: { onNavigate: () => void }) {
  const pool = usePool();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const query = text.trim();
  const matches = (pool.data?.miners ?? [])
    .filter((address) => !query || address.includes(query))
    .sort();
  return (
    <>
      <div className="search-view">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validAddress(query)) return;
            onNavigate();
            navigate(minerPath(query));
          }}
        >
          <input
            className="vsc-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="钱包地址（回车查询）"
            aria-label="搜索矿工地址"
            spellCheck={false}
            maxLength={256}
          />
        </form>
        <p className="search-summary">
          {pool.data
            ? `${matches.length} 个结果 · 已记录矿工共 ${pool.data.miners.length} 个`
            : pool.isError
              ? "无法读取矿工索引"
              : "正在读取矿工索引…"}
        </p>
      </div>
      <Section
        title="矿工索引"
        actions={
          <Tooltip title="刷新">
            <button
              type="button"
              aria-label="刷新矿工索引"
              onClick={() => void pool.refetch()}
            >
              <ReloadOutlined spin={pool.isFetching} />
            </button>
          </Tooltip>
        }
      >
        {matches.slice(0, 200).map((address) => (
          <NavLink
            key={address}
            to={minerPath(address)}
            onClick={onNavigate}
            title={address}
            className={({ isActive }) =>
              `tree-item ${isActive ? "active" : ""}`
            }
            style={{ paddingLeft: 20 }}
          >
            <FileIcon page={{ path: "", kind: "miner" }} />
            <span className="tree-label mono">{highlight(address, query)}</span>
          </NavLink>
        ))}
        {matches.length > 200 && (
          <p className="pane-empty">仅显示前 200 个结果，请输入更多字符。</p>
        )}
      </Section>
    </>
  );
}

function highlight(address: string, query: string) {
  const text = shorten(address);
  const at = query ? text.indexOf(query) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

function AdminView({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      <Section title="运维">
        {explorerPages.admin.map((path) => (
          <TreeLink key={path} path={path} depth={0} onNavigate={onNavigate} />
        ))}
      </Section>
      <Section title="说明">
        <p className="pane-empty">
          管理页面需要服务器配置的管理员账号。业务数据只读；权限由 Go
          后端校验，不依赖前端隐藏。
        </p>
      </Section>
    </>
  );
}

const titles: Record<View, string> = {
  explorer: "资源管理器",
  search: "搜索",
  admin: "管理控制台",
};

export function SideBar({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: () => void;
}) {
  return (
    <aside className="sidebar" aria-label={titles[view]}>
      <div className="sidebar-title">{titles[view]}</div>
      <div className="sidebar-content">
        {view === "explorer" && <Explorer onNavigate={onNavigate} />}
        {view === "search" && <Search onNavigate={onNavigate} />}
        {view === "admin" && <AdminView onNavigate={onNavigate} />}
      </div>
    </aside>
  );
}
