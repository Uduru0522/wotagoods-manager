import { createAppMode } from "./app-mode.js";
import { getAppElements } from "./app-elements.js";
import { APP_CONFIG } from "./config.js";
import { bindLayoutTransition } from "./layout-transition.js";
import { renderStartupError, renderStartupLoading } from "./startup-state.js";
import { bindViewScrollState } from "./view-scroll-state.js";
import { createViewRouter } from "./view-router.js";
import { createAppStorage } from "../data/create-storage.js";
import { createNavigation } from "../navigation/navigation.js";
import { createThemeController } from "../services/theme.js";
import { registerServiceWorker } from "../services/service-worker-registration.js";
import { bindDragScroll } from "../shared/drag-scroll.js";
import { createViewDefinitions } from "../views/view-definitions.js";
import { createViewRenderer } from "../views/view-renderer.js";

export function createApp({ storageFactory = createAppStorage } = {}) {
  const elements = getAppElements();
  const appMode = createAppMode();
  const themeController = createThemeController();
  let activeStorage = null;
  let startupAttempt = 0;

  function mountApplication(goodsTypes) {
    const views = createViewDefinitions(goodsTypes);
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

    navigation.render();
    router.setActiveView(APP_CONFIG.defaultViewId);
  }

  async function loadData() {
    const attempt = ++startupAttempt;

    activeStorage?.close();
    renderStartupLoading(elements);

    try {
      const storage = storageFactory({
        indexedDBFactory: globalThis.indexedDB,
        isDebugMode: appMode.isDebugMode
      });

      activeStorage = storage;
      await storage.initialize();
      const goodsTypes = await storage.listGoodsTypes();

      if (attempt === startupAttempt) {
        mountApplication(goodsTypes);
      }
    } catch (error) {
      console.error("Application storage initialization failed:", error);

      if (attempt === startupAttempt) {
        renderStartupError(elements, error, {
          onRetry: () => void loadData()
        });
      }
    }
  }

  async function start() {
    themeController.initialize();
    bindLayoutTransition();
    bindDragScroll(elements.viewPanel, { axis: "y" });
    bindViewScrollState(elements.viewPanel);
    registerServiceWorker();
    await loadData();
  }

  return {
    start
  };
}
