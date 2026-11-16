import { expect, it } from "vitest";
import { formatHashrate, hashrateParts } from "./format";

it("formats hashrates with SI prefixes and the API's unit", () => {
  expect(formatHashrate(0)).toBe("0 H/s");
  expect(formatHashrate(950)).toBe("950 H/s");
  expect(formatHashrate(26_666.7)).toBe("26.7 kH/s");
  expect(formatHashrate(1_234_567_890)).toBe("1.23 GH/s");
  expect(formatHashrate(4.2e18)).toBe("4.2 EH/s");
  expect(formatHashrate(8192, "Sol/s")).toBe("8.19 kSol/s");
  expect(hashrateParts(3.5e15)).toEqual({ value: "3.5", unit: "PH/s" });
  expect(formatHashrate(undefined)).toBe("—");
  expect(formatHashrate(Number.NaN)).toBe("—");
});
