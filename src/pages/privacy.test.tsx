// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Route } from "react-router-dom";
import Overview from "./Overview";
import Payments from "./Payments";
import { renderApp, stubApi } from "../test/render";
import { demoResponse } from "../lib/demo";

const rates = {
  hashrate1min: 5,
  hashrate30min: 5,
  hashrate1h: 5,
  hashrate6h: 5,
  hashrate1d: 5,
};
const meta = {
  "/api/config/coin": { name: "Quantus", symbol: "QTC" },
  "/api/config/algorithm": { name: "poseidon2" },
  "/api/config/ports": {},
};
const ledger = {
  decimals: 12,
  finalizedHeight: 900,
  unconfirmedCandidates: 0,
  balances: {},
  pending: null,
  paid: [],
  blocks: [{ hash: "0xblock", height: 899, reward: "5000000000000" }],
};

describe("miner privacy", () => {
  it("overview shows the miner count but never a miner list", async () => {
    // Even an older backend that still returns the index must not be rendered.
    stubApi({
      ...meta,
      "/api/pool": {
        ...rates,
        coinName: "Quantus",
        miners: ["qtc1secretminer"],
        minerCount: 1,
      },
    });
    const { container } = renderApp(<Route index element={<Overview />} />);
    expect(await screen.findByText("累计矿工")).toBeTruthy();
    expect(container.textContent).not.toContain("qtc1secretminer");
  });

  it("public payments page lists no recipients and queries by address", async () => {
    const fetcher = stubApi({
      ...meta,
      "/api/": ["/payments"],
      "/api/payments": ledger,
      "/api/payments?address=qtc1me%2Bx": {
        ...ledger,
        balances: { "qtc1me+x": "2000000000000" },
        paid: [
          {
            hash: "0xpaid",
            height: 880,
            outputs: [{ address: "qtc1me+x", amount: "1000000000000" }],
          },
        ],
      },
    });
    renderApp(<Route index element={<Payments />} />);
    expect(await screen.findByText("最近结算区块")).toBeTruthy();
    expect(screen.queryByText("收款矿工")).toBeNull();

    const input = screen.getByLabelText("收款地址");
    fireEvent.change(input, { target: { value: "qtc1me+x" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", keyCode: 13 });
    await waitFor(() =>
      expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(
        "/api/payments?address=qtc1me%2Bx",
      ),
    );
    expect(await screen.findByText("待结算余额")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("demo fixtures follow the same rules as the Go API", () => {
    const pool = demoResponse("/pool") as Record<string, unknown>;
    expect(pool.miners).toBeUndefined();
    expect(pool.minerCount).toBe(12);
    expect(
      (demoResponse("/pool", true) as { miners: string[] }).miners,
    ).toHaveLength(12);

    const all = JSON.stringify(demoResponse("/payments"));
    expect(all).not.toContain("qtc1sample");
    expect(all).not.toContain("qtc1nomp");

    const mine = demoResponse("/payments?address=qtc1sample018m4x9p7z2k6v3n5w");
    expect(JSON.stringify(mine)).not.toContain("qtc1nomp");
    expect((mine as { paid: unknown[] }).paid.length).toBeGreaterThan(0);
  });
});
