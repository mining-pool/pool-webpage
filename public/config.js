// Runtime configuration, read before the app starts. Deployments replace this
// file (the Docker image generates it from environment variables) so one build
// can serve any pool. Empty values fall back to the VITE_* build-time settings.
// Never put secrets here: it is public.
window.NOMP_CONFIG = {
  apiBaseUrl: "",
  poolName: "",
  stratumHost: "",
};
