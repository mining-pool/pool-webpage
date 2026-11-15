export const site = {
  apiBase: (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""),
  name: import.meta.env.VITE_POOL_NAME || "NOMP Pool",
  stratumHost:
    import.meta.env.VITE_STRATUM_HOST ||
    (typeof window === "undefined" ? "localhost" : window.location.hostname),
  demo: import.meta.env.VITE_DEMO === "true",
};
