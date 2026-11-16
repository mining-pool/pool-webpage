import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// End-to-end tests run the production build against the real Go API
// (not-only-mining-pool/scripts/web-fixture) on a different origin, the way the
// site is deployed. Set NOMP_REPO to the backend checkout.
const backend = resolve(process.env.NOMP_REPO || "../not-only-mining-pool");
const api = "http://127.0.0.1:20100";
const web = "http://127.0.0.1:4173";
export const adminPassword = "e2e-admin-password-0123";
/** The fixture's config.json; tests edit it and reload. */
export const fixtureConfig = join(tmpdir(), "nomp-e2e-config.json");

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: web,
    // Locally reuse an installed Chrome (PLAYWRIGHT_CHANNEL=chrome); CI installs Chromium.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: `go run ./scripts/web-fixture -addr 127.0.0.1:20100 -origin ${web} -config ${fixtureConfig}`,
      cwd: backend,
      url: `${api}/api/`,
      env: { NOMP_FIXTURE_ADMIN_PASSWORD: adminPassword },
      timeout: 180_000,
      reuseExistingServer: false,
    },
    {
      command: "npm run build && node e2e/serve.mjs",
      url: `${web}/`,
      env: { NOMP_API_BASE_URL: api, NOMP_POOL_NAME: "E2E Pool" },
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
