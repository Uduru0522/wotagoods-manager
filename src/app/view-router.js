import { APP_CONFIG } from "./config.js";
import { clearElement } from "../shared/dom.js";
import {
  getCustomPropertyDurationMs,
  prefersReducedMotion
} from "../shared/motion.js";
import { getViewById } from "../views/view-definitions.js";

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

    if (!viewPanel.hasChildNodes() || prefersReducedMotion()) {
      viewPanel.classList.remove("is-switching");
      commitView(view);
      return;
    }

    viewPanel.classList.add("is-switching");
    const motionDurationMs = getCustomPropertyDurationMs(
      document.documentElement,
      "--motion-fast",
      APP_CONFIG.motion.fastFallbackMs
    );

    viewSwitchTimer = window.setTimeout(() => {
      commitView(view);
      requestAnimationFrame(() => viewPanel.classList.remove("is-switching"));
    }, Math.round(motionDurationMs / 2));
  }

  return {
    setActiveView
  };
}
