import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { App as AntApp } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import { ThemeProvider } from "../lib/theme";

/** Renders the current location so tests can assert navigation. */
export function Location() {
  const { pathname } = useLocation();
  return <output data-testid="location">{pathname}</output>;
}

export function renderApp(routes: ReactNode, path = "/") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ThemeProvider>
      <AntApp>
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>{routes}</Routes>
            <Location />
          </MemoryRouter>
        </QueryClientProvider>
      </AntApp>
    </ThemeProvider>,
  );
}

/** Stubs fetch with JSON responses keyed by request path (query included). */
export function stubApi(responses: Record<string, unknown>) {
  const fetcher = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = responses[url];
    return body === undefined
      ? new Response("{}", { status: 404 })
      : new Response(JSON.stringify(body));
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
