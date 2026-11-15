import { useEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "antd";
import {
  ApiOutlined,
  DashboardOutlined,
  DesktopOutlined,
  MenuOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { site } from "../lib/config";
import { minerPath, shorten, validAddress } from "../lib/format";
import { useRecentAddresses } from "../lib/recent";
import { useTheme } from "../lib/theme";
import { StatusBar } from "./StatusBar";

type Item = { path: string; label: string; icon: ReactNode };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "矿池",
    items: [
      { path: "/", label: "矿池概览", icon: <DashboardOutlined /> },
      { path: "/miner", label: "我的矿机", icon: <DesktopOutlined /> },
      { path: "/payments", label: "支付记录", icon: <WalletOutlined /> },
      { path: "/connect", label: "开始挖矿", icon: <ApiOutlined /> },
    ],
  },
  {
    title: "管理",
    items: [
      {
        path: "/admin",
        label: "运行概览",
        icon: <SafetyCertificateOutlined />,
      },
      { path: "/admin/miners", label: "矿工管理", icon: <TeamOutlined /> },
      { path: "/admin/payments", label: "支付监控", icon: <WalletOutlined /> },
      { path: "/admin/config", label: "矿池配置", icon: <SettingOutlined /> },
    ],
  },
];

const mac =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);

function TopSearch() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((mac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <form
      className={`top-search ${invalid ? "invalid" : ""}`}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const address = value.trim();
        if (!validAddress(address)) {
          setInvalid(true);
          return;
        }
        setValue("");
        input.current?.blur();
        navigate(minerPath(address));
      }}
    >
      <SearchOutlined />
      <input
        ref={input}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setInvalid(false);
        }}
        placeholder="输入钱包地址查询矿工"
        aria-label="钱包地址"
        aria-invalid={invalid}
        spellCheck={false}
        autoComplete="off"
        maxLength={256}
      />
      <kbd aria-hidden="true">{mac ? "⌘K" : "Ctrl K"}</kbd>
    </form>
  );
}

export function Shell() {
  const { pathname } = useLocation();
  const { mode, toggle } = useTheme();
  const recent = useRecentAddresses();
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  useEffect(() => {
    const item = groups
      .flatMap((g) => g.items)
      .find((i) => i.path === (pathname.replace(/\/+$/, "") || "/"));
    document.title = `${item?.label ?? (pathname.startsWith("/miner/") ? "矿工" : "NOMP")} · ${site.name}`;
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        跳转到内容
      </a>
      <header className="topbar">
        <button
          type="button"
          className="icon-button menu-button"
          aria-label="打开导航"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          <MenuOutlined />
        </button>
        <NavLink to="/" className="brand" onClick={close}>
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span className="brand-name">{site.name}</span>
        </NavLink>
        <TopSearch />
        <Tooltip title={mode === "dark" ? "切换到浅色" : "切换到深色"}>
          <button
            type="button"
            className="icon-button"
            aria-label="切换颜色主题"
            onClick={toggle}
          >
            {mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
          </button>
        </Tooltip>
      </header>

      <div className="body">
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <nav aria-label="主导航">
            {groups.map((group) => (
              <div key={group.title} className="nav-group">
                <div className="nav-title">{group.title}</div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === "/" || item.path === "/admin"}
                    onClick={close}
                    className={({ isActive }) =>
                      `nav-item ${isActive ? "active" : ""}`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
            {!!recent.length && (
              <div className="nav-group">
                <div className="nav-title">最近查询</div>
                {recent.map((address) => (
                  <NavLink
                    key={address}
                    to={minerPath(address)}
                    onClick={close}
                    title={address}
                    className={({ isActive }) =>
                      `nav-item mono ${isActive ? "active" : ""}`
                    }
                  >
                    <span>{shorten(address)}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </nav>
        </aside>
        {menu && <div className="scrim" aria-hidden="true" onClick={close} />}
        <main id="main" className="main" tabIndex={-1}>
          <div className="content">
            <Outlet />
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
