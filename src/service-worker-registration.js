import { APP_CONFIG } from "./config.js";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(APP_CONFIG.serviceWorkerPath).catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}
