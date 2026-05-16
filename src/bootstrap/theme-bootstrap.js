(() => {
  const DARK_THEME_COLOR = "#101417";
  const LIGHT_THEME_COLOR = "#2f6f73";

  try {
    const theme = localStorage.getItem("wotagoods.theme") === "dark" ? "dark" : "light";
    const themeColor = theme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
