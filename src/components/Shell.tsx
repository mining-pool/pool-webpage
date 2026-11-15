import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Tooltip } from "antd";
import {
  CloseOutlined,
  CopyOutlined,
  LayoutOutlined,
  MoonOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { site } from "../lib/config";
import { useActivity } from "../lib/activity";
import { normalizePath, pageInfo } from "../lib/routes";
import { useTheme } from "../lib/theme";
import { CommandPalette, type Command } from "./workbench/CommandPalette";
import { FileIcon } from "./workbench/FileIcon";
import { Panel, type PanelTab } from "./workbench/Panel";
import { SideBar, type View } from "./workbench/SideBar";
import { StatusBar } from "./workbench/StatusBar";

const tabsKey = "nomp:tabs";
const mac =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);
const mod = mac ? "⌘" : "Ctrl+";

function savedTabs(): string[] {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(tabsKey) || "[]");
    return Array.isArray(data)
      ? data.filter((v): v is string => typeof v === "string").slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

const narrow = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 860px)").matches;

export function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = normalizePath(location.pathname);
  const page = pageInfo(path);
  const { mode, toggle } = useTheme();
  const activity = useActivity();

  const [view, setView] = useState<View>(
    path.startsWith("/admin") ? "admin" : "explorer",
  );
  const [sidebar, setSidebar] = useState(() => !narrow());
  const [panel, setPanel] = useState(false);
  const [panelTab, setPanelTab] = useState<PanelTab>("output");
  const [palette, setPalette] = useState(false);
  const [tabs, setTabs] = useState<string[]>(savedTabs);

  // Every visited route becomes an editor tab (unknown routes are not kept).
  useEffect(() => {
    setTabs((current) =>
      current.includes(path) || page.kind === "missing"
        ? current
        : [...current, path].slice(-12),
    );
  }, [path, page.kind]);
  useEffect(() => {
    try {
      sessionStorage.setItem(tabsKey, JSON.stringify(tabs));
    } catch {
      /* storage may be disabled */
    }
  }, [tabs]);
  useEffect(() => {
    document.title = `${page.title} · ${site.name}`;
  }, [page.title]);

  const closeTab = (target: string) => {
    const index = tabs.indexOf(target);
    const rest = tabs.filter((tab) => tab !== target);
    setTabs(rest);
    if (target === path)
      navigate(rest[Math.min(index, rest.length - 1)] ?? "/");
  };

  const chooseView = (next: View) => {
    // Clicking the active view collapses the side bar, as in VS Code.
    if (sidebar && view === next) setSidebar(false);
    else {
      setView(next);
      setSidebar(true);
    }
  };
  const afterNavigate = useCallback(() => {
    if (narrow()) setSidebar(false);
  }, []);

  const openPanel = useCallback((tab: PanelTab) => {
    setPanelTab(tab);
    setPanel(true);
  }, []);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: "toggle-theme",
        label: "首选项: 切换颜色主题",
        detail: mode === "dark" ? "浅色" : "深色",
        icon: mode === "dark" ? <SunOutlined /> : <MoonOutlined />,
        run: toggle,
      },
      {
        id: "toggle-sidebar",
        label: "视图: 切换主侧边栏",
        keybinding: `${mod}B`,
        icon: <LayoutOutlined />,
        run: () => setSidebar((v) => !v),
      },
      {
        id: "toggle-panel",
        label: "视图: 切换面板",
        keybinding: `${mod}J`,
        icon: <LayoutOutlined />,
        run: () => setPanel((v) => !v),
      },
      {
        id: "show-output",
        label: "视图: 显示输出",
        icon: <LayoutOutlined />,
        run: () => openPanel("output"),
      },
      {
        id: "show-problems",
        label: "视图: 显示问题",
        icon: <LayoutOutlined />,
        run: () => openPanel("problems"),
      },
      {
        id: "close-tabs",
        label: "视图: 关闭其他编辑器",
        icon: <CloseOutlined />,
        run: () => setTabs([path]),
      },
    ],
    [mode, openPanel, path, toggle],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const primary = mac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();
      if (
        e.key === "F1" ||
        (primary && key === "k") ||
        (primary && e.shiftKey && key === "p")
      ) {
        e.preventDefault();
        setPalette(true);
      } else if (primary && !e.shiftKey && key === "b") {
        e.preventDefault();
        setSidebar((v) => !v);
      } else if (primary && !e.shiftKey && key === "j") {
        e.preventDefault();
        setPanel((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activities: { id: View; label: string; icon: ReactNode }[] = [
    { id: "explorer", label: "资源管理器", icon: <CopyOutlined /> },
    { id: "search", label: "搜索矿工", icon: <SearchOutlined /> },
    { id: "admin", label: "管理控制台", icon: <SafetyCertificateOutlined /> },
  ];

  return (
    <div className={`workbench ${sidebar ? "with-sidebar" : ""}`}>
      <a className="skip-link" href="#main">
        跳转到内容
      </a>
      <header className="titlebar">
        <div className="titlebar-left">
          <span className="app-mark" aria-hidden="true">
            N
          </span>
          <span className="titlebar-name">{site.name}</span>
        </div>
        <button
          type="button"
          className="command-center"
          onClick={() => setPalette(true)}
          aria-label="打开命令面板"
        >
          <SearchOutlined />
          <span className="command-label">搜索钱包地址或命令</span>
          <kbd>{mod}K</kbd>
        </button>
        <div className="titlebar-right">
          <Tooltip title={`切换主侧边栏 (${mod}B)`}>
            <button
              type="button"
              aria-label="切换主侧边栏"
              aria-pressed={sidebar}
              onClick={() => setSidebar((v) => !v)}
            >
              <LayoutOutlined />
            </button>
          </Tooltip>
          <Tooltip title={`切换面板 (${mod}J)`}>
            <button
              type="button"
              aria-label="切换面板"
              aria-pressed={panel}
              onClick={() => setPanel((v) => !v)}
            >
              <LayoutOutlined rotate={-90} />
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="workbench-body">
        <nav className="activitybar" aria-label="活动栏">
          {activities.map((item) => (
            <Tooltip key={item.id} title={item.label} placement="right">
              <button
                type="button"
                aria-label={item.label}
                aria-pressed={sidebar && view === item.id}
                className={sidebar && view === item.id ? "active" : ""}
                onClick={() => chooseView(item.id)}
              >
                {item.icon}
              </button>
            </Tooltip>
          ))}
          <div className="activity-spacer" />
          <Tooltip title="切换颜色主题" placement="right">
            <button type="button" aria-label="切换颜色主题" onClick={toggle}>
              {mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </Tooltip>
        </nav>

        {sidebar && (
          <>
            <div
              className="sidebar-scrim"
              aria-hidden="true"
              onClick={() => setSidebar(false)}
            />
            <SideBar view={view} onNavigate={afterNavigate} />
          </>
        )}

        <div className="editor-group">
          <div className="tabs" role="tablist" aria-label="已打开的编辑器">
            {tabs.map((tab) => {
              const info = pageInfo(tab);
              const active = tab === path;
              return (
                <div
                  key={tab}
                  role="tab"
                  aria-selected={active}
                  tabIndex={0}
                  className={`tab ${active ? "active" : ""}`}
                  title={tab}
                  onClick={() => navigate(tab)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(tab);
                    }
                  }}
                  onAuxClick={(e) => {
                    if (e.button === 1) closeTab(tab);
                  }}
                >
                  <FileIcon page={info} />
                  <span className="tab-label">{info.title}</span>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      className="tab-close"
                      aria-label={`关闭 ${info.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab);
                      }}
                    >
                      <CloseOutlined />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="breadcrumbs" aria-label="路径">
            {page.crumbs.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <RightOutlined className="crumb-sep" />}
                {i === page.crumbs.length - 1 ? (
                  <>
                    <FileIcon page={page} />
                    <span className="crumb-current">{crumb}</span>
                  </>
                ) : (
                  crumb
                )}
              </span>
            ))}
          </div>
          <main id="main" className="editor" tabIndex={-1}>
            <div className="editor-content">
              <Outlet />
            </div>
          </main>
          {panel && (
            <Panel
              tab={panelTab}
              onTab={setPanelTab}
              onClose={() => setPanel(false)}
              log={activity.log}
              problems={activity.problems}
              onClear={activity.clear}
            />
          )}
        </div>
      </div>

      <StatusBar
        problems={activity.problems.length}
        onProblems={() =>
          panel && panelTab === "problems"
            ? setPanel(false)
            : openPanel("problems")
        }
        onPalette={() => setPalette(true)}
      />
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        commands={commands}
      />
    </div>
  );
}
