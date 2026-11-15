import { afterEach, describe, expect, it, vi } from "vitest";
import { api, request } from "./api";
import { demoAddress, demoResponse } from "./demo";
import { formatUnits, minerPath, validAddress } from "./format";
import { paymentsSchema, poolSchema, portsSchema } from "./schemas";

afterEach(() => vi.unstubAllGlobals());
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });

describe("NOMP API adapter", () => {
  it("accepts Go nil collections and rejects malformed statistics", () => {
    const pool = { ...(demoResponse("/pool") as object), miners: null };
    expect(poolSchema.parse(pool).miners).toEqual([]);
    expect(poolSchema.safeParse({ ...pool, hashrate1min: "bad" }).success).toBe(
      false,
    );
    const payments = {
      ...(demoResponse("/payments") as object),
      balances: null,
      pending: null,
      paid: null,
      blocks: null,
    };
    expect(paymentsSchema.parse(payments)).toMatchObject({
      balances: {},
      paid: [],
      blocks: [],
    });
  });
  it("only retains public port fields and preserves protocol", () => {
    const ports = portsSchema.parse({
      "3333": {
        diff: 1,
        protocol: "quic",
        tls: { keyFile: "/secret/key.pem" },
        varDiff: null,
      },
    });
    expect(ports["3333"]).toEqual({
      diff: 1,
      protocol: "quic",
      tls: true,
      varDiff: null,
    });
  });
  it("encodes non-Bitcoin identities and uses the admin proxy only when requested", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(reply(demoResponse(`/miner/${demoAddress}`)));
    vi.stubGlobal("fetch", fetcher);
    await api.miner("kaspa:q+abc", true);
    expect(fetcher.mock.calls[0][0]).toBe("/admin-api/miner/kaspa%3Aq%2Babc");
  });
  it("distinguishes an unsupported payment capability from an unavailable service", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(reply(["/pool"]));
    vi.stubGlobal("fetch", fetcher);
    expect(await api.payments(false)).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher
      .mockResolvedValueOnce(reply(["/payments"]))
      .mockResolvedValueOnce(reply("payments disabled", 503));
    await expect(api.payments(false)).rejects.toMatchObject({ status: 503 });
  });
  it("reports authentication failures and invalid JSON without exposing response bodies", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply("private detail", 401))
      .mockResolvedValueOnce(new Response("<html>not an API</html>"));
    vi.stubGlobal("fetch", fetcher);
    await expect(api.pool(true)).rejects.toMatchObject({ status: 401 });
    await expect(api.pool(false)).rejects.toThrow("数据格式");
  });
  it("does not substitute preview data after network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Network failure")),
    );
    await expect(request("/pool", poolSchema)).rejects.toThrow(
      "暂时无法连接矿池",
    );
  });
  it("preserves cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(controller.signal.reason));
    await expect(api.pool(false, controller.signal)).rejects.toBe(
      controller.signal.reason,
    );
  });
});

describe("wallet identities and exact amounts", () => {
  it("formats balances beyond Number precision without rounding", () => {
    expect(formatUnits("123456789012345678901234567890", 12)).toBe(
      "123456789012345678.90123456789",
    );
    expect(formatUnits("1", 12)).toBe("0.000000000001");
    expect(formatUnits("1000000000000", 12)).toBe("1");
    expect(formatUnits("0", 12)).toBe("0");
    expect(formatUnits("17", 0)).toBe("17");
    expect(formatUnits("1e12", 12)).toBe("—");
  });
  it("allows engine-specific identities but rejects URL delimiters and whitespace", () => {
    expect(validAddress("kaspa:qabcdef")).toBe(true);
    expect(validAddress("qtc1abcd")).toBe(true);
    for (const address of [
      "",
      "..",
      ".",
      "wallet/name",
      "wallet?x",
      "wallet#x",
      "two words",
      "a\nb",
      "a".repeat(257),
    ])
      expect(validAddress(address)).toBe(false);
    expect(minerPath("kaspa:qabcdef")).toBe("/miner/kaspa%3Aqabcdef");
  });
});
