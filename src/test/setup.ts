// jsdom lacks a few browser APIs that Ant Design and Recharts rely on.
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (!window.matchMedia)
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

if (!window.ResizeObserver)
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

// jsdom does not implement pseudo-element styles; antd only reads them for scrollbars.
const computed = window.getComputedStyle.bind(window);
window.getComputedStyle = (element: Element) => computed(element);

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
});
