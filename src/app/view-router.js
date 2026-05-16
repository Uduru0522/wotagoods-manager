import { APP_CONFIG } from "./config.js";
import { clearElement } from "../shared/dom.js";
import { getViewById } from "../views/view-definitions.js";

function getMotionDurationMs() {
  const rawValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-fast")
    .trim();

  if (rawValue.endsWith("ms")) {
    return Number.parseFloat(rawValue);
  }

  if (rawValue.endsWith("s")) {
    return Number.parseFloat(rawValue) * 1000;
  }

  return APP_CONFIG.motion.fastFallbackMs;
}

export function createViewRouter({ navigation, renderer, views, viewPanel, viewSection, viewTitle }) {
  let activeViewId = null;
  let viewSwitchTimer = 0;

  function commitView(view) {
    viewSection.textContent = view.section;
    viewTitle.textContent = view.title;
    viewPanel.scrollTop = 0;
    viewPanel.scrollLeft = 0;
    clearElement(viewPanel);
    viewPanel.append(renderer.render(view));
  }

  function setActiveView(viewId) {
    const view = getViewById(views, viewId);

    if (view.id === activeViewId) {
      return;
    }

    activeViewId = view.id;
    clearTimeout(viewSwitchTimer);
    navigation.setActiveView(view.id);

    if (!viewPanel.hasChildNodes()) {
      commitView(view);
      return;
    }

    viewPanel.classList.add("is-switching");
    viewSwitchTimer = window.setTimeout(() => {
      commitView(view);
      requestAnimationFrame(() => viewPanel.classList.remove("is-switching"));
    }, Math.round(getMotionDurationMs() / 2));
  }

  return {
    setActiveView
  };
}
