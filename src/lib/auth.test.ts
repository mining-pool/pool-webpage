import { afterEach, expect, it, vi } from "vitest";
import { auth } from "./auth";
import { api } from "./api";

afterEach(() => vi.unstubAllGlobals());
const session = {
  username: "operator",
  expiresAt: "2026-10-03T10:00:00Z",
  csrfToken: "csrf-test-token",
};
it("distinguishes an expired session from an unconfigured server", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("{}", { status: 401 }))
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ code: "admin_disabled", message: "x" }), {
        status: 503,
      }),
    );
  vi.stubGlobal("fetch", fetcher);
  expect(await auth.session()).toBeNull();
  await expect(auth.session()).rejects.toMatchObject({
    status: 503,
    kind: "auth",
    code: "admin_disabled",
  });
});
it("posts login credentials to Go and attaches the CSRF token on logout", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(session)))
    .mockResolvedValueOnce(new Response('{"ok":true}'));
  vi.stubGlobal("fetch", fetcher);
  expect(
    await auth.login({
      username: "operator",
      password: "private-test-password",
    }),
  ).toEqual(session);
  expect(fetcher.mock.calls[0][0]).toBe("/admin-api/auth/login");
  expect(fetcher.mock.calls[0][1]).toMatchObject({
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  await auth.logout(session.csrfToken);
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    method: "POST",
    headers: { "X-CSRF-Token": session.csrfToken },
  });
});
it("signals session expiry for protected API requests", async () => {
  const dispatchEvent = vi.fn();
  vi.stubGlobal("window", { dispatchEvent });
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response("{}", { status: 401 })),
  );
  await expect(api.pool(true)).rejects.toMatchObject({ status: 401 });
  expect(dispatchEvent.mock.calls[0][0].type).toBe("nomp:session-expired");
});
it("rejects malformed session responses", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response('{"username":"operator"}')),
  );
  await expect(auth.session()).rejects.toMatchObject({ kind: "authFormat" });
});
