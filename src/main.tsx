import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { App as AntApp, Result, Spin } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ApiError } from "./lib/api";
import { ThemeProvider } from "./lib/theme";
import "./styles.css";

const Overview = lazy(() => import("./pages/Overview"));
const MinerPage = lazy(() => import("./pages/Miner"));
const Connect = lazy(() => import("./pages/Connect"));
const Payments = lazy(() => import("./pages/Payments"));
const Admin = lazy(() => import("./pages/Admin"));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15000,
      retry: (count, error) =>
        count < 1 &&
        !(error instanceof ApiError && [401, 403, 404].includes(error.status)),
      refetchOnWindowFocus: true,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Routes>
              <Route element={<Shell />}>
                <Route
                  index
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <Overview />
                    </Suspense>
                  }
                />
                <Route
                  path="miner"
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <MinerPage />
                    </Suspense>
                  }
                />
                <Route
                  path="miner/:address"
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <MinerPage />
                    </Suspense>
                  }
                />
                <Route
                  path="connect"
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <Connect />
                    </Suspense>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <Payments />
                    </Suspense>
                  }
                />
                <Route
                  path="admin/*"
                  element={
                    <Suspense fallback={<Spin className="page-spin" />}>
                      <Admin />
                    </Suspense>
                  }
                />
                <Route
                  path="*"
                  element={
                    <Result
                      status="404"
                      title="页面不存在"
                      extra={<Link to="/">返回矿池概览</Link>}
                    />
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ThemeProvider>
  </StrictMode>,
);
