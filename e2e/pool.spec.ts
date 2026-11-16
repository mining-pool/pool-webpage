import { expect, test as base } from "@playwright/test";
import { adminPassword } from "../playwright.config";

// Identities seeded by not-only-mining-pool/scripts/web-fixture.
const alpha = "qtc1fixtureminer0alpha";
const bravo = "qtc1fixtureminer1bravo";
const charlie = "qtc1fixtureminer2charlie";

// Every test fails on uncaught errors and CSP violations. Expected HTTP 401s
// (no admin session yet, wrong password) are the only tolerated console errors.
const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("pageerror", (error) => problems.push(error.message));
      page.on("console", (message) => {
        const text = message.text();
        if (message.type() !== "error") return;
        if (/status of 401/.test(text)) return;
        problems.push(text);
      });
      await use(problems);
      expect(problems, "console errors / CSP violations").toEqual([]);
    },
    { auto: true },
  ],
});

test("overview shows live pool stats without listing miners", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Pool overview" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Live");
  await expect(page.locator(".metric-card").nth(2)).toContainText("3");
  await expect(page.locator(".info-list")).toContainText("Quantus");
  // 300M difficulty of shares (1 difficulty = 1 hash) over the 24 h window.
  await expect(page.locator(".metric-value").nth(1)).toHaveText("3.47kH/s");
  await expect(page.locator(".metric-value").first()).toHaveText(/H\/s$/);
  await expect(page.locator("body")).not.toContainText("diff/s");
  // Axis labels such as "4.5 MH/s" must not be clipped by the chart edge.
  const chart = (await page.locator(".rate-chart svg").first().boundingBox())!;
  const ticks = page.locator(
    ".rate-chart .recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value",
  );
  await expect(ticks.first()).toBeVisible();
  for (const box of await ticks.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().left),
  ))
    expect(box).toBeGreaterThanOrEqual(chart.x);
  const html = await page.content();
  for (const miner of [alpha, bravo, charlie])
    expect(html).not.toContain(miner);
});

test("miner lookup shows rigs and contribution", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("search").getByRole("textbox");
  await search.fill(alpha);
  await search.press("Enter");
  await expect(page).toHaveURL(`/miner/${alpha}`);
  await expect(page.getByRole("button", { name: "rig-a1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "rig-a2" })).toBeVisible();
  await expect(page.getByText("2 recorded")).toBeVisible();
  // 180M difficulty over 24 h for this miner.
  await expect(page.locator(".metric-value").nth(1)).toHaveText("2.08kH/s");
  await expect(page.locator("body")).not.toContainText("diff/s");
  await expect(
    page.getByText("Shares in the last minute").first(),
  ).toBeVisible();

  // Deep links survive a reload (SPA fallback).
  await page.reload();
  await expect(page.getByRole("button", { name: "rig-a1" })).toBeVisible();
});

test("public payments reveal only the requested address", async ({ page }) => {
  await page.goto("/payments");
  await expect(page.getByText("Recent settled blocks")).toBeVisible();
  await expect(page.getByText("Finalized height 51,234")).toBeVisible();
  expect(await page.content()).not.toContain(alpha);

  const lookup = page.getByLabel("Payout address");
  await lookup.fill(alpha);
  await lookup.press("Enter");
  await expect(page.getByText("Unpaid balance")).toBeVisible();
  await expect(page.locator(".balance-banner")).toContainText("1.5");
  await expect(page.getByText("2", { exact: true })).toBeVisible();
  const html = await page.content();
  expect(html).not.toContain(bravo);
  expect(html).not.toContain("0xfixturepending"); // bravo's pending payout
});

test("connect guide lists the configured ports", async ({ page }) => {
  await page.goto("/connect");
  const ports = page.locator(".ant-table").last();
  await expect(ports).toContainText("3333");
  await expect(ports).toContainText("QUIC");
  await expect(ports).toContainText("Stratum TLS");
  await expect(page.locator(".connection-output")).toContainText(
    "quic://127.0.0.1:3333",
  );
});

test("admin console uses a real session with cookies and CSRF", async ({
  page,
}) => {
  await page.goto("/admin/miners");
  await expect(
    page.getByRole("heading", { name: "Sign in to the admin console" }),
  ).toBeVisible();

  await page.getByLabel("Username").fill("operator");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect username or password.")).toBeVisible();

  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Signed in")).toBeVisible();
  // The full index is only available to the administrator.
  for (const miner of [alpha, bravo, charlie])
    await expect(page.getByText(miner)).toBeVisible();

  await page.getByRole("link", { name: "Payment monitor" }).click();
  await expect(page.getByText(bravo).first()).toBeVisible();

  // The session survives a reload, then logout invalidates it server-side.
  await page.reload();
  await expect(page.getByText("Signed in")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to the admin console" }),
  ).toBeVisible();
  const status = await page.evaluate(async () => {
    const response = await fetch(
      `${window.NOMP_CONFIG!.apiBaseUrl as string}/admin-api/pool`,
      { credentials: "include" },
    );
    return response.status;
  });
  expect(status).toBe(401);
});

test("language can be switched to Chinese and is remembered", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await page.getByLabel("Language").selectOption("zh");
  await expect(page.getByRole("heading", { name: "矿池概览" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("status")).toHaveText("实时接口");
  await expect(page.getByRole("link", { name: "支付记录" })).toBeVisible();
});

test("runtime config sets the pool name and the API origin", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".brand-name")).toHaveText("E2E Pool");
  await expect(page).toHaveTitle(/E2E Pool/);
  const response = await page.request.get("/");
  expect(response.headers()["content-security-policy"]).toContain(
    "connect-src 'self' http://127.0.0.1:20100",
  );
});

test("uses square corners everywhere", async ({ page }) => {
  const rounded = async () =>
    page.evaluate(() => {
      const found: string[] = [];
      for (const el of document.querySelectorAll("body *")) {
        for (const pseudo of [null, "::before", "::after"]) {
          const style = getComputedStyle(el, pseudo);
          if (pseudo && style.content === "none") continue;
          const radii = [
            style.borderTopLeftRadius,
            style.borderTopRightRadius,
            style.borderBottomLeftRadius,
            style.borderBottomRightRadius,
          ];
          if (radii.some((r) => r !== "0px" && r !== "")) {
            const name = `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}${pseudo ?? ""}`;
            found.push(`${name} ${radii.join(" ")}`);
          }
        }
      }
      return [...new Set(found)];
    });
  for (const theme of ["dark", "light"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const path of [
      "/",
      `/miner/${alpha}`,
      "/payments",
      "/connect",
      "/admin",
    ]) {
      await page.goto(path);
      await expect(page.getByRole("status")).toHaveText("Live");
      expect(await rounded(), `${theme} ${path}`).toEqual([]);
    }
  }
});

test("centres the header search like a command center", async ({ page }) => {
  for (const width of [1440, 1100, 900]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const box = (await page.getByRole("search").boundingBox())!;
    expect(
      Math.abs(box.x + box.width / 2 - width / 2),
      `width ${width}`,
    ).toBeLessThanOrEqual(1);
  }
});
