import { APP_CONFIG } from "./config.js";

export function createAppMode() {
  const params = new URLSearchParams(window.location.search);
  const debugValue = params.get(APP_CONFIG.debugQueryParam);

  return {
    isDebugMode: debugValue === "1" || debugValue === "true"
  };
}
