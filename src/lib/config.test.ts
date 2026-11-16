import { expect, it, vi } from "vitest";
import { apiOrigin } from "./config";

it("accepts only bare http(s) origins for the API", () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  expect(apiOrigin("https://api.pool.example:20000/")).toBe(
    "https://api.pool.example:20000",
  );
  expect(apiOrigin(" http://127.0.0.1:20000 ")).toBe("http://127.0.0.1:20000");
  expect(apiOrigin("")).toBeUndefined();
  expect(apiOrigin(undefined)).toBeUndefined();
  for (const bad of [
    "javascript:alert(1)",
    "https://api.pool.example/api",
    "https://user:pass@api.pool.example",
    "https://api.pool.example?x=1",
    "ftp://api.pool.example",
    "not a url",
    42,
  ])
    expect(apiOrigin(bad)).toBeUndefined();
  expect(error).toHaveBeenCalled();
  error.mockRestore();
});
