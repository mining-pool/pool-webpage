import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type Messages } from "./en";
import { zh } from "./zh";
import { ApiError } from "../lib/api";

export type Lang = "en" | "zh";
export const languages: Record<Lang, { messages: Messages; locale: string }> = {
  en: { messages: en, locale: "en-US" },
  zh: { messages: zh, locale: "zh-CN" },
};

const key = "nomp:lang";

/** Saved choice, then the browser's preferred languages; English otherwise. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(key);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* storage may be disabled */
  }
  const preferred =
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language];
  for (const tag of preferred) {
    const lower = (tag || "").toLowerCase();
    if (lower.startsWith("en")) return "en";
    if (lower.startsWith("zh")) return "zh";
  }
  return "en";
}

// Formatting helpers outside React (format.ts) read the active locale here.
let activeLocale = languages.en.locale;
export const currentLocale = () => activeLocale;

const LanguageContext = createContext<{
  lang: Lang;
  t: Messages;
  setLang: (lang: Lang) => void;
}>({ lang: "en", t: en, setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);
  activeLocale = languages[lang].locale;
  useEffect(() => {
    document.documentElement.lang = languages[lang].locale;
  }, [lang]);
  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(key, next);
    } catch {
      /* storage may be disabled */
    }
    setLangState(next);
  }, []);
  const value = useMemo(
    () => ({ lang, t: languages[lang].messages, setLang }),
    [lang, setLang],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;

/** Error text in the active language; API errors carry a kind, not prose. */
export function errorText(t: Messages, error: unknown): string {
  if (!(error instanceof ApiError)) return t.errors.unknown;
  switch (error.kind) {
    case "network":
      return t.errors.network;
    case "session":
      return t.errors.session;
    case "notFound":
      return t.errors.notFound;
    case "format":
      return t.errors.format;
    case "authNetwork":
      return t.errors.authNetwork;
    case "authFormat":
      return t.errors.authFormat;
    case "auth":
      return (
        (error.code && t.authCodes[error.code]) ||
        t.errors.authUnavailable(error.status)
      );
    default:
      return t.errors.unavailable(error.status);
  }
}
