// @vitest-environment jsdom
import "../test/setup";
import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import {
  clearRecentAddresses,
  rememberAddress,
  useRecentAddresses,
} from "./recent";

it("keeps the six most recent distinct addresses and updates subscribers", () => {
  const { result } = renderHook(() => useRecentAddresses());
  expect(result.current).toEqual([]);
  act(() => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 3]) rememberAddress(`addr${n}`);
  });
  expect(result.current).toEqual([
    "addr3",
    "addr7",
    "addr6",
    "addr5",
    "addr4",
    "addr2",
  ]);
  act(() => clearRecentAddresses());
  expect(result.current).toEqual([]);
  expect(localStorage.getItem("nomp:recent-addresses")).toBeNull();
});

it("ignores tampered storage and reports storage failures", () => {
  // Written while nothing is subscribed, e.g. by another tab.
  localStorage.setItem(
    "nomp:recent-addresses",
    JSON.stringify(["ok1", "bad/../x", 42, "two words"]),
  );
  const { result } = renderHook(() => useRecentAddresses());
  expect(result.current).toEqual(["ok1"]);

  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  expect(rememberAddress("ok2")).toBe(false);
  vi.restoreAllMocks();
});
