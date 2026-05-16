export const APP_CONFIG = {
  defaultViewId: "dashboard",
  layout: {
    narrowQuery: "(max-width: 760px)",
    transitionDurationMs: 180
  },
  motion: {
    fastFallbackMs: 350
  },
  serviceWorkerPath: "service-worker.js",
  selectors: {
    primaryNavList: "#primaryNavList",
    utilityNavList: "#utilityNavList",
    viewPanel: "#viewPanel",
    viewSection: "#viewSection",
    viewTitle: "#viewTitle"
  },
  theme: {
    colors: {
      dark: "#101417",
      light: "#2f6f73"
    },
    dark: "dark",
    light: "light",
    storageKey: "theme",
    storageNamespace: "wotagoods"
  }
};
