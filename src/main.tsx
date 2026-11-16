import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { App as AntApp, Result } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { ApiError } from "./lib/api";
import { ThemeProvider } from "./lib/theme";
import { LanguageProvider, useT } from "./i18n";
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

function NotFound() {
  const t = useT();
  return (
    <Result
      status="404"
      title={t.notFound.title}
      extra={<Link to="/">{t.notFound.back}</Link>}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<Overview />} />
                  <Route path="miner" element={<MinerPage />} />
                  <Route path="miner/:address" element={<MinerPage />} />
                  <Route path="connect" element={<Connect />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="admin/*" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </AntApp>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
);
