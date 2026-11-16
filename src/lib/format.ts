import { currentLocale } from "../i18n";

export function formatRate(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(currentLocale(), {
    maximumFractionDigits: 3,
    notation: value >= 10000 ? "compact" : "standard",
  }).format(value);
}

// Never coerce base-unit amounts to Number: QTC uses 12 decimal places.
export function formatUnits(units: string, decimals: number): string {
  if (
    !/^\d+$/.test(units) ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 30
  )
    return "—";
  const raw = BigInt(units)
    .toString()
    .padStart(decimals + 1, "0");
  if (!decimals) return raw;
  const fraction = raw.slice(-decimals).replace(/0+$/, "");
  return `${raw.slice(0, -decimals)}${fraction ? `.${fraction}` : ""}`;
}

export const shorten = (value: string) =>
  value.length > 26 ? `${value.slice(0, 12)}…${value.slice(-8)}` : value;
export const minerPath = (address: string) =>
  `/miner/${encodeURIComponent(address)}`;
export function validAddress(value: string): boolean {
  // Identity formats vary by engine; do not impose Bitcoin-only validation.
  return (
    value.length > 0 &&
    value.length <= 256 &&
    !/[\s/\\?#\u0000-\u001f\u007f]/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

export const formatNumber = (value: number) =>
  value.toLocaleString(currentLocale());

export const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString(currentLocale(), { hour12: false });
