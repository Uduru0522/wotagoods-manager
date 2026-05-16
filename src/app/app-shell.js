import { createAppMode } from "./app-mode.js";
import { getAppElements } from "./app-elements.js";
import { APP_CONFIG } from "./config.js";
import { bindLayoutTransition } from "./layout-transition.js";
import { bindViewScrollState } from "./view-scroll-state.js";
import { createViewRouter } from "./view-router.js";
import { loadGoodsTypes } from "../data/goods-types.js";
import { createNavigation } from "../navigation/navigation.js";
import { createThemeController } from "../services/theme.js";
import { registerServiceWorker } from "../services/service-worker-registration.js";
import { bindDragScroll } from "../shared/drag-scroll.js";
import { createViewDefinitions } from "../views/view-definitions.js";
import { createViewRenderer } from "../views/view-renderer.js";

export function createApp() {
  const elements = getAppElements();
  const appMode = createAppMode();
  const goodsTypes = loadGoodsTypes(appMode);
  const views = createViewDefinitions(goodsTypes);
  const themeController = createThemeController();
  const renderer = createViewRenderer({ goodsTypes, themeController });
  let router;

  const navigation = createNavigation({
    primaryContainer: elements.primaryNavList,
    utilityContainer: elements.utilityNavList,
    views,
    onSelect: (viewId) => router.setActiveView(viewId)
  });

  router = createViewRouter({
    navigation,
    renderer,
    views,
    viewPanel: elements.viewPanel,
    viewSection: elements.viewSection,
    viewTitle: elements.viewTitle
  });

  function start() {
    themeController.initialize();
    navigation.render();
    bindLayoutTransition();
    bindDragScroll(elements.viewPanel, { axis: "y" });
    bindViewScrollState(elements.viewPanel);
    router.setActiveView(APP_CONFIG.defaultViewId);
    registerServiceWorker();
  }

  return {
    start
  };
}
