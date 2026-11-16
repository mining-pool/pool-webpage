type RuntimeConfig = {
  apiBaseUrl?: unknown;
  poolName?: unknown;
  stratumHost?: unknown;
};

declare global {
  interface Window {
    NOMP_CONFIG?: RuntimeConfig;
  }
}

const runtime: RuntimeConfig =
  (typeof window !== "undefined" && window.NOMP_CONFIG) || {};

const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** API origin such as https://api.pool.example[:port]; anything else is rejected. */
export function apiOrigin(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (url.pathname === "/" || url.pathname === "") &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    )
      return url.origin;
  } catch {
    /* fall through */
  }
  console.error(`Ignoring invalid NOMP API base URL: ${raw}`);
  return undefined;
}

const hostname = (value: unknown) => {
  const raw = text(value);
  return raw && /^[A-Za-z0-9.-]+$/.test(raw) ? raw : undefined;
};

export const site = {
  apiBase:
    apiOrigin(runtime.apiBaseUrl) ??
    apiOrigin(import.meta.env.VITE_API_BASE_URL) ??
    "",
  name:
    text(runtime.poolName) ??
    text(import.meta.env.VITE_POOL_NAME) ??
    "NOMP Pool",
  stratumHost:
    hostname(runtime.stratumHost) ??
    hostname(import.meta.env.VITE_STRATUM_HOST) ??
    (typeof window === "undefined" ? "localhost" : window.location.hostname),
  // Demo data is a build-time switch only; it can never be enabled at runtime.
  demo: import.meta.env.VITE_DEMO === "true",
};
