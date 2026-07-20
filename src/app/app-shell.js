import { createAppMode } from "./app-mode.js";
import { getAppElements } from "./app-elements.js";
import { mountAppRuntime } from "./app-runtime.js";
import { bindLayoutTransition } from "./layout-transition.js";
import { createMutationController } from "./mutation-controller.js";
import { createStartupCoordinator } from "./startup-coordinator.js";
import { renderStartupError, renderStartupLoading } from "./startup-state.js";
import { bindViewScrollState } from "./view-scroll-state.js";
import { createAppStorage } from "../data/create-storage.js";
import { createThemeController } from "../services/theme.js";
import { registerServiceWorker } from "../services/service-worker-registration.js";
import { bindDragScroll } from "../shared/drag-scroll.js";

export function createApp({ storageFactory = createAppStorage } = {}) {
  const elements = getAppElements();
  const appMode = createAppMode();
  const themeController = createThemeController();
  const mutationController = createMutationController(elements.appShell);
  let startupCoordinator;

  startupCoordinator = createStartupCoordinator({
    createStorage: storageFactory,
    indexedDBFactory: globalThis.indexedDB,
    isDebugMode: appMode.isDebugMode,
    mountApplication: ({ goodsTypes, initialViewId, storage }) =>
      mountAppRuntime({
        elements,
        goodsTypes,
        initialViewId,
        mutationController,
        onGoodsTypeCreated: (goodsTypeId) =>
          startupCoordinator.refresh({ initialViewId: `goods:${goodsTypeId}` }),
        onLocalDataReset: () => startupCoordinator.refresh(),
        storage,
        themeController
      }),
    renderError: (error, options) => renderStartupError(elements, error, options),
    renderLoading: () => renderStartupLoading(elements)
  });
  let hasStarted = false;

  function handlePageHide(event) {
    if (!event.persisted) {
      stop();
    }
  }

  function stop() {
    if (!hasStarted) {
      return;
    }

    hasStarted = false;
    startupCoordinator.stop();
    window.removeEventListener("pagehide", handlePageHide);
  }

  async function start() {
    if (hasStarted) {
      return;
    }

    hasStarted = true;
    themeController.initialize();
    bindLayoutTransition();
    bindDragScroll(elements.viewPanel, { axis: "y" });
    bindViewScrollState(elements.viewPanel);
    registerServiceWorker();
    window.addEventListener("pagehide", handlePageHide);
    await startupCoordinator.start();
  }

  return {
    start,
    stop
  };
}
