import { APP_CONFIG } from "../app/config.js";
import { createStorage } from "./storage.js";

export function createThemeController() {
  const { colors, dark, light, storageKey, storageNamespace } = APP_CONFIG.theme;
  const storage = createStorage(storageNamespace);

  function getSavedTheme() {
    return storage.get(storageKey);
  }

  function getTheme() {
    return document.documentElement.dataset.theme === dark ? dark : light;
  }

  function setTheme(theme) {
    const normalizedTheme = theme === dark ? dark : light;
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');

    document.documentElement.dataset.theme = normalizedTheme;
    document.documentElement.style.colorScheme = normalizedTheme;
    themeColorMeta?.setAttribute("content", colors[normalizedTheme]);
    storage.set(storageKey, normalizedTheme);
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
