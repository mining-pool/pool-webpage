import { z } from "zod";
import { site } from "./config";
import {
  algorithmSchema,
  coinSchema,
  minerSchema,
  paymentsSchema,
  poolSchema,
  portsSchema,
  rigSchema,
} from "./schemas";

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  admin = false,
  signal?: AbortSignal,
): Promise<T> {
  if (site.demo) {
    const { demoResponse } = await import("./demo");
    return schema.parse(demoResponse(path));
  }
  let response: Response;
  try {
    response = await fetch(
      `${site.apiBase}${admin ? "/admin-api" : "/api"}${path}`,
      {
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(12000)])
          : AbortSignal.timeout(12000),
        headers: { Accept: "application/json" },
        credentials: "include",
      },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError("暂时无法连接矿池，请检查网络或稍后重试。");
  }
  if (!response.ok) {
    if (admin && response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("nomp:session-expired"));
    }
    const message =
      response.status === 401
        ? "管理员会话已过期，请重新登录。"
        : response.status === 404
          ? "当前矿池未提供此接口。"
          : `矿池接口暂不可用（${response.status}）。`;
    throw new ApiError(message, response.status);
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError("矿池返回的数据格式不符合接口约定。");
  }
}

export const api = {
  pool: (admin: boolean, signal?: AbortSignal) =>
    request("/pool", poolSchema, admin, signal),
  metadata: async (admin: boolean, signal?: AbortSignal) => {
    const [coin, algorithm, ports] = await Promise.all([
      request("/config/coin", coinSchema, admin, signal),
      request("/config/algorithm", algorithmSchema, admin, signal),
      request("/config/ports", portsSchema, admin, signal),
    ]);
    return { coin, algorithm, ports };
  },
  miner: (address: string, admin: boolean, signal?: AbortSignal) =>
    request(
      `/miner/${encodeURIComponent(address)}`,
      minerSchema,
      admin,
      signal,
    ),
  rig: (address: string, rig: string, signal?: AbortSignal) =>
    request(
      `/miner/${encodeURIComponent(address)}/rig/${encodeURIComponent(rig)}`,
      rigSchema,
      false,
      signal,
    ),
  payments: async (admin: boolean, signal?: AbortSignal) => {
    // Discover optional capabilities; a broken registered endpoint is an error, not "unsupported".
    const paths = await request("/", z.array(z.string()), admin, signal);
    if (!paths.includes("/payments")) return null;
    return request("/payments", paymentsSchema, admin, signal);
  },
};
