import { APP_CONFIG } from "./config.js";

let transitionTimeoutId = null;

function getLayoutName(mediaQueryList) {
  return mediaQueryList.matches ? "narrow" : "wide";
}

function animateLayoutChange(layoutName) {
  const root = document.documentElement;

  window.clearTimeout(transitionTimeoutId);
  root.dataset.layoutTransition = layoutName;

  transitionTimeoutId = window.setTimeout(() => {
    delete root.dataset.layoutTransition;
  }, APP_CONFIG.layout.transitionDurationMs);
}

export function bindLayoutTransition() {
  if (!window.matchMedia) {
    return;
  }

  const mediaQueryList = window.matchMedia(APP_CONFIG.layout.narrowQuery);
  let currentLayout = getLayoutName(mediaQueryList);
  const handleLayoutChange = () => {
    const nextLayout = getLayoutName(mediaQueryList);

    if (nextLayout !== currentLayout) {
      currentLayout = nextLayout;
      animateLayoutChange(nextLayout);
    }
  };

  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener("change", handleLayoutChange);
    return;
  }

  mediaQueryList.addListener(handleLayoutChange);
}
