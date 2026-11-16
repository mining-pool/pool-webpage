// Apply the saved colour theme and language before first paint.
(function () {
  var root = document.documentElement;
  try {
    var theme = localStorage.getItem("nomp:theme");
    root.dataset.theme =
      theme === "light" || theme === "dark"
        ? theme
        : matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
    if (localStorage.getItem("nomp:lang") === "zh") root.lang = "zh-CN";
  } catch (e) {
    root.dataset.theme = "dark";
  }
})();
