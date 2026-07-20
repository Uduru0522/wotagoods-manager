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
      const goodsTypes = await storage.listGoodsTypes();

      if (currentAttempt !== attemptNumber || isStopped) {
        storage.close();
        return;
      }

      mountApplication(goodsTypes);
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

  function stop() {
    isStopped = true;
    attemptNumber += 1;
    activeStorage?.close();
    activeStorage = null;
  }

  return {
    start,
    stop
  };
}
