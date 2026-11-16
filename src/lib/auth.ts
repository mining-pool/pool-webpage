import { z } from "zod";
import { ApiError } from "./api";
import { site } from "./config";

const sessionSchema = z.object({
  username: z.string(),
  expiresAt: z.string().datetime({ offset: true }),
  csrfToken: z.string().min(1),
});
export type AdminSession = z.infer<typeof sessionSchema>;

/** Requests to the session-protected admin API (credentials included). */
export async function adminRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${site.apiBase}/admin-api${path}`, {
      ...init,
      signal: init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)])
        : AbortSignal.timeout(12000),
      credentials: "include",
      headers: { Accept: "application/json", ...init.headers },
    });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError("authNetwork");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const data = z.object({ code: z.string().max(64) }).safeParse(body);
    throw new ApiError(
      "auth",
      response.status,
      data.success ? data.data.code : undefined,
      body,
    );
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError("authFormat");
  }
}

const authRequest = <T>(
  endpoint: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
) => adminRequest(`/auth/${endpoint}`, schema, init);

const list = z
  .array(z.string())
  .nullish()
  .transform((v) => v ?? []);
const reloadReport = z.object({
  at: z.string(),
  trigger: z.string(),
  actor: z.string().optional(),
  ok: z.boolean(),
  changes: list,
  errors: list,
});
export type ReloadReport = z.infer<typeof reloadReport>;

/** Configuration reload: re-reads config.json on the server (no upload). */
export const reload = {
  status: (signal?: AbortSignal) =>
    adminRequest("/reload", z.object({ last: reloadReport.nullable() }), {
      signal,
    }),
  run: (csrfToken: string) =>
    adminRequest("/reload", reloadReport, {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    }),
};

const settingsDocument = z.object({
  version: z.string().min(1),
  inForce: z.boolean(),
  settings: z.record(z.string(), z.unknown()),
});
export type SettingsDocument = z.infer<typeof settingsDocument>;

/** The reloadable part of config.json, edited through the admin API. */
export const settingsApi = {
  get: (signal?: AbortSignal) =>
    adminRequest("/settings", settingsDocument, { signal }),
  put: (version: string, settings: unknown, csrfToken: string) =>
    adminRequest("/settings", reloadReport, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ version, settings }),
    }),
  /** A 422 carries the reload report explaining why nothing was applied. */
  rejection: (error: unknown) =>
    error instanceof ApiError && error.status === 422
      ? reloadReport.safeParse(error.detail).data
      : undefined,
  /** A 400 carries the server's explanation (e.g. an unknown field). */
  message: (error: unknown) =>
    error instanceof ApiError
      ? z.object({ message: z.string() }).safeParse(error.detail).data?.message
      : undefined,
};

export const auth = {
  session: async (signal?: AbortSignal): Promise<AdminSession | null> => {
    try {
      return await authRequest("session", sessionSchema, { signal });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },
  login: (values: { username: string; password: string }) =>
    authRequest("login", sessionSchema, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }),
  logout: (csrfToken: string) =>
    authRequest("logout", z.object({ ok: z.literal(true) }), {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
    }),
};
