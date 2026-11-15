// @vitest-environment jsdom
import "../test/setup";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { Route, useParams } from "react-router-dom";
import { Shell } from "./Shell";
import { rememberAddress } from "../lib/recent";
import { renderApp, stubApi } from "../test/render";

function MinerProbe() {
  return <p>miner:{useParams().address}</p>;
}

const routes = (
  <Route element={<Shell />}>
    <Route index element={<p>home</p>} />
    <Route path="miner/:address" element={<MinerProbe />} />
  </Route>
);

const pool = {
  hashrate1min: 12,
  hashrate30min: 1,
  hashrate1h: 1,
  hashrate6h: 1,
  hashrate1d: 1,
  coinName: "Quantus",
  minerCount: 3,
};

describe("Shell", () => {
  beforeEach(() => {
    stubApi({ "/api/pool": pool });
  });

  it("looks up a miner from the top search, encoding the address", async () => {
    renderApp(routes);
    const input = screen.getByLabelText("钱包地址");
    fireEvent.change(input, { target: { value: "  kaspa:qabc  " } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByText("miner:kaspa:qabc")).toBeTruthy();
    expect(screen.getByTestId("location").textContent).toBe(
      "/miner/kaspa%3Aqabc",
    );
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("rejects invalid addresses without navigating", () => {
    renderApp(routes);
    const input = screen.getByLabelText("钱包地址");
    fireEvent.change(input, { target: { value: "wallet/../admin" } });
    fireEvent.submit(input.closest("form")!);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByTestId("location").textContent).toBe("/");
  });

  it("focuses the search with Ctrl+K", () => {
    renderApp(routes);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(document.activeElement).toBe(screen.getByLabelText("钱包地址"));
  });

  it("toggles and persists the colour theme", async () => {
    renderApp(routes);
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("dark"),
    );
    fireEvent.click(screen.getByLabelText("切换颜色主题"));
    await waitFor(() =>
      expect(document.documentElement.dataset.theme).toBe("light"),
    );
    expect(localStorage.getItem("nomp:theme")).toBe("light");
  });

  it("lists only addresses this browser chose to remember", () => {
    renderApp(routes);
    expect(screen.queryByText("最近查询")).toBeNull();
    act(() => {
      rememberAddress("qtc1remembered");
    });
    expect(screen.getByText("最近查询")).toBeTruthy();
    expect(screen.getByTitle("qtc1remembered")).toBeTruthy();
  });

  it("shows live pool status in the status bar", async () => {
    renderApp(routes);
    expect(await screen.findByText("实时接口")).toBeTruthy();
    expect(screen.getByText("12 diff/s")).toBeTruthy();
  });

  it("does not render workbench chrome such as editor tabs", () => {
    renderApp(routes);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeTruthy();
  });
});
