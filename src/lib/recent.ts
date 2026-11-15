import { useSyncExternalStore } from "react";
import { validAddress } from "./format";

// Addresses are stored only when the user opts in ("在此设备记住地址").
const key = "nomp:recent-addresses";
const event = "nomp:recent-changed";

function read(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data)
      ? data
          .filter((v): v is string => typeof v === "string" && validAddress(v))
          .slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

let snapshot = read();
const refresh = () => {
  snapshot = read();
};

function subscribe(listener: () => void) {
  const changed = () => {
    refresh();
    listener();
  };
  window.addEventListener(event, changed);
  window.addEventListener("storage", changed);
  return () => {
    window.removeEventListener(event, changed);
    window.removeEventListener("storage", changed);
  };
}

export const useRecentAddresses = () =>
  useSyncExternalStore(subscribe, () => snapshot);

/** Returns false when the browser refuses storage. */
export function rememberAddress(address: string): boolean {
  try {
    const next = [address, ...read().filter((v) => v !== address)].slice(0, 6);
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
