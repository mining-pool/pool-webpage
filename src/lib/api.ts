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

export type ApiErrorKind =
  | "network"
  | "session"
  | "notFound"
  | "unavailable"
  | "format"
  | "auth"
  | "authNetwork"
  | "authFormat";

/**
 * Errors carry a kind (and the Go API's error code), not user-facing prose,
 * so the UI can show them in the active language (see i18n errorText).
 */
export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    public status = 0,
    public code?: string,
    /** Parsed error body, for endpoints that return details (e.g. reports). */
    public detail?: unknown,
  ) {
    super(`${kind}${status ? ` (${status})` : ""}${code ? `: ${code}` : ""}`);
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
    return schema.parse(demoResponse(path, admin));
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
    throw new ApiError("network");
  }
  if (!response.ok) {
    if (admin && response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("nomp:session-expired"));
    }
    throw new ApiError(
      response.status === 401
        ? "session"
        : response.status === 404
          ? "notFound"
          : "unavailable",
      response.status,
    );
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError("format");
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
  /**
   * Public callers only receive pool-level data plus the records of `address`;
   * administrators receive the full ledger.
   */
  payments: async (admin: boolean, address = "", signal?: AbortSignal) => {
    // Discover optional capabilities; a broken registered endpoint is an error, not "unsupported".
    const paths = await request("/", z.array(z.string()), admin, signal);
    if (!paths.includes("/payments")) return null;
    const query = address ? `?address=${encodeURIComponent(address)}` : "";
    return request(`/payments${query}`, paymentsSchema, admin, signal);
  },
};
