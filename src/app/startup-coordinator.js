export function createStartupCoordinator({
  createStorage,
  indexedDBFactory,
  isDebugMode,
  logger = console,
  mountApplication,
  renderError,
  renderLoading
}) {
  let activeStorage = null;
  let attemptNumber = 0;
  let isStopped = false;

  async function mountFromStorage(storage, currentAttempt, initialViewId) {
    const goodsTypes = await storage.listGoodsTypes();

    if (currentAttempt !== attemptNumber || isStopped) {
      return false;
    }

    mountApplication({ goodsTypes, initialViewId, storage });
    return true;
  }

  async function load() {
    if (isStopped) {
      return;
    }

    const currentAttempt = ++attemptNumber;

    activeStorage?.close();
    renderLoading();

    try {
      const storage = createStorage({ indexedDBFactory, isDebugMode });

      activeStorage = storage;
      await storage.initialize();
      const didMount = await mountFromStorage(storage, currentAttempt);

      if (!didMount) {
        storage.close();
      }
    } catch (error) {
      if (currentAttempt !== attemptNumber || isStopped) {
        return;
      }

      logger.error("Application storage initialization failed:", error);
      renderError(error, { onRetry: load });
    }
  }

  function start() {
    isStopped = false;
    return load();
  }

  async function refresh({ initialViewId } = {}) {
    if (isStopped || !activeStorage) {
      return false;
    }

    const currentAttempt = ++attemptNumber;
    return mountFromStorage(activeStorage, currentAttempt, initialViewId);
  }

  function stop() {
    isStopped = true;
    attemptNumber += 1;
    activeStorage?.close();
    activeStorage = null;
  }

  return {
    refresh,
    start,
    stop
  };
}
