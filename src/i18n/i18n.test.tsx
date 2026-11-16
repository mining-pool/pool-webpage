// @vitest-environment jsdom
import "../test/setup";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Route } from "react-router-dom";
import { Shell } from "../components/Shell";
import { ApiError } from "../lib/api";
import { formatDifficulty, formatHashrate } from "../lib/format";
import { renderApp, stubApi } from "../test/render";
import { en } from "./en";
import { zh } from "./zh";
import { detectLang, errorText } from ".";

function keys(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === "object"
      ? keys(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe("languages", () => {
  it("translates every English key into Chinese", () => {
    expect(keys(zh).sort()).toEqual(keys(en).sort());
  });

  it("defaults to English and follows the browser for Chinese", () => {
    expect(detectLang()).toBe("en");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["zh-TW", "en"]);
    expect(detectLang()).toBe("zh");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["fr-FR", "de"]);
    expect(detectLang()).toBe("en");
    localStorage.setItem("nomp:lang", "zh");
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["en-US"]);
    expect(detectLang()).toBe("zh");
    vi.restoreAllMocks();
  });

  it("switches the whole shell and remembers the choice", async () => {
    stubApi({});
    renderApp(<Route path="/" element={<Shell />} />);
    expect(screen.getByText("Overview")).toBeTruthy();
    expect(document.documentElement.lang).toBe("en-US");
    fireEvent.change(screen.getByLabelText("Language"), {
      target: { value: "zh" },
    });
    expect(await screen.findByText("矿池概览")).toBeTruthy();
    expect(screen.getByLabelText("钱包地址")).toBeTruthy();
    expect(document.documentElement.lang).toBe("zh-CN");
    expect(localStorage.getItem("nomp:lang")).toBe("zh");
    expect(formatDifficulty(123456)).toBe("12.346万");
    expect(formatHashrate(1.5e12, "H/s")).toBe("1.5 TH/s");
  });

  it("localises API error codes, falling back to the status", () => {
    const login = new ApiError("auth", 401, "invalid_credentials");
    expect(errorText(en, login)).toBe("Incorrect username or password.");
    expect(errorText(zh, login)).toBe("用户名或密码错误。");
    expect(errorText(en, new ApiError("auth", 502, "surprise"))).toBe(
      "The login service is unavailable (502).",
    );
    expect(errorText(en, new ApiError("unavailable", 503))).toContain("503");
    expect(errorText(en, new Error("boom"))).toBe("Something went wrong.");
  });
});
