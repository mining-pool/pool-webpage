// Serves dist/ the way deploy/nginx does: SPA fallback, runtime /config.js and
// the same security headers (parsed from the nginx template, so the browser
// tests run under the production CSP).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const port = Number(process.env.E2E_WEB_PORT || 4173);
const env = {
  NOMP_API_BASE_URL: process.env.NOMP_API_BASE_URL || "",
  NOMP_POOL_NAME: process.env.NOMP_POOL_NAME || "",
  NOMP_STRATUM_HOST: process.env.NOMP_STRATUM_HOST || "",
};
const render = (text) =>
  text.replace(/\$\{(NOMP_[A-Z_]+)\}/g, (_, name) => env[name] ?? "");

const template = await readFile(
  new URL("../deploy/nginx/security-headers.inc.template", import.meta.url),
  "utf8",
);
const headers = Object.fromEntries(
  [...render(template).matchAll(/^add_header (\S+) "([^"]*)" always;$/gm)].map(
    ([, name, value]) => [name, value],
  ),
);
if (!headers["Content-Security-Policy"]) throw new Error("CSP not parsed");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  for (const [name, value] of Object.entries(headers))
    res.setHeader(name, value);
  if (path === "/config.js") {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      `window.NOMP_CONFIG={apiBaseUrl:"${env.NOMP_API_BASE_URL}",poolName:"${env.NOMP_POOL_NAME}",stratumHost:"${env.NOMP_STRATUM_HOST}"};\n`,
    );
    return;
  }
  let file = normalize(join(root, path));
  if (!file.startsWith(root)) {
    res.writeHead(400).end();
    return;
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a file");
  } catch {
    if (path.startsWith("/assets/")) {
      res.writeHead(404).end();
      return;
    }
    file = join(root, "index.html");
  }
  res.setHeader(
    "Content-Type",
    types[extname(file)] || "application/octet-stream",
  );
  res.setHeader(
    "Cache-Control",
    path.startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "no-cache",
  );
  res.end(await readFile(file));
}).listen(port, "127.0.0.1", () =>
  console.log(`e2e static server on http://127.0.0.1:${port}`),
);
