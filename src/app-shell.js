import { APP_CONFIG } from "./config.js";
import { createNavigation } from "./navigation.js";
import { createViewRenderer } from "./renderers.js";
import { registerServiceWorker } from "./service-worker-registration.js";
import { createThemeController } from "./theme.js";
import { createViewRouter } from "./view-router.js";
import { VIEW_DEFINITIONS } from "./views.js";

function queryRequiredElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

function getAppElements() {
  const { selectors } = APP_CONFIG;

  return {
    navList: queryRequiredElement(selectors.navList),
    viewPanel: queryRequiredElement(selectors.viewPanel),
    viewSection: queryRequiredElement(selectors.viewSection),
    viewTitle: queryRequiredElement(selectors.viewTitle)
  };
}

export function createApp() {
  const elements = getAppElements();
  const themeController = createThemeController();
  const renderer = createViewRenderer({ themeController });
  let router;

  const navigation = createNavigation({
    container: elements.navList,
    views: VIEW_DEFINITIONS,
    onSelect: (viewId) => router.setActiveView(viewId)
  });

  router = createViewRouter({
    navigation,
    renderer,
    viewPanel: elements.viewPanel,
    viewSection: elements.viewSection,
    viewTitle: elements.viewTitle
  });

  function start() {
    themeController.initialize();
    navigation.render();
    router.setActiveView(APP_CONFIG.defaultViewId);
    registerServiceWorker();
  }

  return {
    start
  };
}
