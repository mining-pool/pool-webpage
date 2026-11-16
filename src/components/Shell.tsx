import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Tooltip } from "antd";
import {
  ApiOutlined,
  DashboardOutlined,
  GlobalOutlined,
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
import { languages, useLanguage, useT, type Lang } from "../i18n";
import type { Messages } from "../i18n/en";
import { ErrorBoundary } from "./ErrorBoundary";
import { StatusBar } from "./StatusBar";

type Item = { path: string; label: keyof Messages["nav"]; icon: ReactNode };

const groups: { title: "pool" | "admin"; items: Item[] }[] = [
  {
    title: "pool",
    items: [
      { path: "/", label: "overview", icon: <DashboardOutlined /> },
      { path: "/miner", label: "miner", icon: <DesktopOutlined /> },
      { path: "/payments", label: "payments", icon: <WalletOutlined /> },
      { path: "/connect", label: "connect", icon: <ApiOutlined /> },
    ],
  },
  {
    title: "admin",
    items: [
      {
        path: "/admin",
        label: "operations",
        icon: <SafetyCertificateOutlined />,
      },
      { path: "/admin/miners", label: "miners", icon: <TeamOutlined /> },
      {
        path: "/admin/payments",
        label: "paymentMonitor",
        icon: <WalletOutlined />,
      },
      { path: "/admin/config", label: "config", icon: <SettingOutlined /> },
    ],
  },
];

const mac =
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);

/** Indeterminate progress line, as VS Code shows while a view loads. */
function ProgressBar({ label }: { label: string }) {
  return (
    <div className="progress-bar" role="progressbar" aria-label={label}>
      <span />
    </div>
  );
}

function LanguageSelect() {
  const { lang, setLang, t } = useLanguage();
  return (
    <label className="lang-select" title={t.shell.language}>
      <GlobalOutlined aria-hidden="true" />
      <select
        aria-label={t.shell.language}
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
      >
        {(Object.keys(languages) as Lang[]).map((code) => (
          <option key={code} value={code}>
            {languages[code].messages.meta.language}
          </option>
        ))}
      </select>
    </label>
  );
}

function TopSearch() {
  const t = useT();
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
        placeholder={t.shell.searchPlaceholder}
        aria-label={t.shell.searchLabel}
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
  const t = useT();
  const recent = useRecentAddresses();
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);

  useEffect(() => {
    const item = groups
      .flatMap((g) => g.items)
      .find((i) => i.path === (pathname.replace(/\/+$/, "") || "/"));
    const title = item
      ? t.nav[item.label]
      : pathname.startsWith("/miner/")
        ? t.shell.minerTitle
        : "";
    document.title = title ? `${title} · ${site.name}` : site.name;
  }, [pathname, t]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        {t.shell.skip}
      </a>
      <header className="topbar">
        <div className="topbar-side">
          <button
            type="button"
            className="icon-button menu-button"
            aria-label={t.shell.openNav}
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
        </div>
        <TopSearch />
        <div className="topbar-side end">
          <LanguageSelect />
          <Tooltip
            title={mode === "dark" ? t.shell.themeLight : t.shell.themeDark}
          >
            <button
              type="button"
              className="icon-button"
              aria-label={t.shell.themeToggle}
              onClick={toggle}
            >
              {mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
            </button>
          </Tooltip>
        </div>
      </header>

      <div className="body">
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <nav aria-label={t.shell.mainNav}>
            {groups.map((group) => (
              <div key={group.title} className="nav-group">
                <div className="nav-title">{t.shell[group.title]}</div>
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
                    <span>{t.nav[item.label]}</span>
                  </NavLink>
                ))}
              </div>
            ))}
            {!!recent.length && (
              <div className="nav-group">
                <div className="nav-title">{t.shell.recent}</div>
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
            <ErrorBoundary resetKey={pathname}>
              <Suspense fallback={<ProgressBar label={t.common.loading} />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <StatusBar />
    </div>
  );
}
