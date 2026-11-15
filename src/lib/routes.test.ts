import { expect, it } from "vitest";
import { describeQuery } from "./activity";
import { pageInfo } from "./routes";

it("maps routes to editor tabs and decodes miner identities", () => {
  expect(pageInfo("/admin/config/")).toMatchObject({
    path: "/admin/config",
    file: "config.json",
    kind: "admin",
  });
  expect(pageInfo("/miner/kaspa%3Aqabc")).toMatchObject({
    title: "kaspa:qabc",
    kind: "miner",
    crumbs: ["pool", "miner", "kaspa:qabc"],
  });
  // Malformed escapes must not crash the shell.
  expect(pageInfo("/miner/%E0%A4%A").kind).toBe("miner");
  expect(pageInfo("/nope").kind).toBe("missing");
});

it("describes the endpoint behind each query for the output panel", () => {
  expect(describeQuery(["pool", true])).toBe("GET /admin-api/pool");
  expect(describeQuery(["rig", "addr", "w1"])).toBe(
    "GET /api/miner/addr/rig/w1",
  );
});
