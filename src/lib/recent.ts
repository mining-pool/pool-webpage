import { useSyncExternalStore } from "react";
import { validAddress } from "./format";

// Addresses are stored only when the user opts in ("在此设备记住地址").
const key = "nomp:recent-addresses";
const event = "nomp:recent-changed";

function stored(): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse(raw: string | null): string[] {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    return Array.isArray(data)
      ? data
          .filter((v): v is string => typeof v === "string" && validAddress(v))
          .slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

// Re-parse only when the stored string changes, so the snapshot stays
// referentially stable for useSyncExternalStore yet never goes stale.
let raw: string | null = null;
let snapshot: string[] = [];
function getSnapshot() {
  const current = stored();
  if (current !== raw) {
    raw = current;
    snapshot = parse(current);
  }
  return snapshot;
}

function subscribe(listener: () => void) {
  window.addEventListener(event, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(event, listener);
    window.removeEventListener("storage", listener);
  };
}

export const useRecentAddresses = () =>
  useSyncExternalStore(subscribe, getSnapshot);

/** Returns false when the browser refuses storage. */
export function rememberAddress(address: string): boolean {
  try {
    const next = [address, ...getSnapshot().filter((v) => v !== address)].slice(
      0,
      6,
    );
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(event));
  return true;
}

export function clearRecentAddresses() {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage may be disabled */
  }
  window.dispatchEvent(new Event(event));
}
