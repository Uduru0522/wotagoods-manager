import { APP_CONFIG } from "./config.js";
import { createStorage } from "./storage.js";

export function createThemeController() {
  const { dark, light } = APP_CONFIG.theme;
  const storage = createStorage("wotagoods");

  function getSavedTheme() {
    return storage.get("theme");
  }

  function getTheme() {
    return document.documentElement.dataset.theme === dark ? dark : light;
  }

  function setTheme(theme) {
    const normalizedTheme = theme === dark ? dark : light;
    document.documentElement.dataset.theme = normalizedTheme;
    storage.set("theme", normalizedTheme);
  }

  function initialize() {
    setTheme(getSavedTheme() === dark ? dark : light);
  }

  return {
    getTheme,
    initialize,
    isDarkMode: () => getTheme() === dark,
    setTheme,
    setDarkMode: (isEnabled) => setTheme(isEnabled ? dark : light)
  };
}
