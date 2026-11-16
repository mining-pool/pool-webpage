import { z } from "zod";
import { ApiError } from "./api";
import { site } from "./config";

const sessionSchema = z.object({
  username: z.string(),
  expiresAt: z.string().datetime({ offset: true }),
  csrfToken: z.string().min(1),
});
export type AdminSession = z.infer<typeof sessionSchema>;

async function authRequest<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${site.apiBase}/admin-api/auth/${endpoint}`, {
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
    const data = z
      .object({ code: z.string().max(64) })
      .safeParse(await response.json().catch(() => null));
    throw new ApiError(
      "auth",
      response.status,
      data.success ? data.data.code : undefined,
    );
  }
  try {
    return schema.parse(await response.json());
  } catch {
    throw new ApiError("authFormat");
  }
}

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
