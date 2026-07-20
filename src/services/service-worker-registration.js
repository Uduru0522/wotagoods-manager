import { APP_CONFIG } from "../app/config.js";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        APP_CONFIG.serviceWorkerPath,
        { updateViaCache: "none" }
      );

      await registration.update();
    } catch (error) {
      console.warn("Service worker registration or update check failed:", error);
    }
  });
}
