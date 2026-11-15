import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import zhCN from "antd/locale/zh_CN";

export type Mode = "dark" | "light";

// Palettes follow VS Code "Dark Modern" / "Light Modern"; CSS reads the same
// values through [data-theme] variables in styles.css.
export const palettes = {
  dark: {
    accent: "#0078d4",
    editor: "#1f1f1f",
    widget: "#252526",
    elevated: "#252526",
    border: "#2b2b2b",
    input: "#313131",
    text: "#cccccc",
    muted: "#9d9d9d",
    grid: "#2b2b2b",
    bar: "#4ec9b0",
    hover: "#2a2d2e",
  },
  light: {
    accent: "#005fb8",
    editor: "#ffffff",
    widget: "#f8f8f8",
    elevated: "#ffffff",
    border: "#e5e5e5",
    input: "#ffffff",
    text: "#3b3b3b",
    muted: "#767676",
    grid: "#e5e5e5",
    bar: "#267f99",
    hover: "#f2f2f2",
  },
} as const;

const key = "nomp:theme";
const ThemeContext = createContext<{
  mode: Mode;
  colors: (typeof palettes)[Mode];
  toggle: () => void;
}>({ mode: "dark", colors: palettes.dark, toggle: () => {} });

function initialMode(): Mode {
  try {
    const saved = localStorage.getItem(key);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage may be disabled */
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const colors = palettes[mode];
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mode === "dark" ? "#181818" : "#f8f8f8");
  }, [mode]);
  const toggle = useCallback(
    () =>
      setMode((current) => {
        const next = current === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(key, next);
        } catch {
          /* storage may be disabled */
        }
        return next;
      }),
    [],
  );
  const value = useMemo(
    () => ({ mode, colors, toggle }),
    [mode, colors, toggle],
  );
  return (
    <ThemeContext.Provider value={value}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm:
            mode === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: colors.accent,
            colorInfo: colors.accent,
            colorLink: mode === "dark" ? "#4daafc" : colors.accent,
            colorBgLayout: colors.editor,
            colorBgContainer: colors.widget,
            colorBgElevated: colors.elevated,
            colorBorder: mode === "dark" ? "#3c3c3c" : "#cecece",
            colorBorderSecondary: colors.border,
            colorText: colors.text,
            colorTextSecondary: colors.muted,
            borderRadius: 4,
            borderRadiusLG: 6,
            fontSize: 13,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
            fontFamilyCode:
              '"Cascadia Code", "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
            motionDurationMid: "0.12s",
          },
          components: {
            Card: { headerFontSize: 11, headerHeight: 38 },
            Table: {
              headerBg: "transparent",
              rowHoverBg: colors.hover,
              cellPaddingBlock: 9,
            },
            Input: { colorBgContainer: colors.input },
            Select: { colorBgContainer: colors.input },
            Tabs: { horizontalMargin: "0 0 12px 0" },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
