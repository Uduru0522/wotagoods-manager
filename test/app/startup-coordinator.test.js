import assert from "node:assert/strict";
import test from "node:test";

import { createStartupCoordinator } from "../../src/app/startup-coordinator.js";

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}

function createStorage({ goodsTypes = [], initialize = async () => {} } = {}) {
  let closeCount = 0;

  return {
    close() {
      closeCount += 1;
    },
    get closeCount() {
      return closeCount;
    },
    initialize,
    async listGoodsTypes() {
      return goodsTypes;
    }
  };
}

function createHarness({ storages }) {
  const errors = [];
  const mounted = [];
  let loadingCount = 0;
  let retry;

  const coordinator = createStartupCoordinator({
    createStorage: () => storages.shift(),
    indexedDBFactory: undefined,
    isDebugMode: false,
    logger: { error() {} },
    mountApplication: (goodsTypes) => mounted.push(goodsTypes),
    renderError: (error, options) => {
      errors.push(error);
      retry = options.onRetry;
    },
    renderLoading: () => {
      loadingCount += 1;
    }
  });

  return {
    coordinator,
    errors,
    get loadingCount() {
      return loadingCount;
    },
    mounted,
    retry: () => retry()
  };
}

test("startup coordinator initializes storage before mounting", async () => {
  const storage = createStorage({ goodsTypes: [{ id: "figures" }] });
  const harness = createHarness({ storages: [storage] });

  await harness.coordinator.start();

  assert.equal(harness.loadingCount, 1);
  assert.deepEqual(harness.mounted, [[{ id: "figures" }]]);
  assert.deepEqual(harness.errors, []);
});

test("startup coordinator exposes a retry after failure", async () => {
  const failure = new Error("failed");
  const failedStorage = createStorage({
    initialize: async () => {
      throw failure;
    }
  });
  const recoveredStorage = createStorage({ goodsTypes: [{ id: "recovered" }] });
  const harness = createHarness({ storages: [failedStorage, recoveredStorage] });

  await harness.coordinator.start();
  await harness.retry();

  assert.deepEqual(harness.errors, [failure]);
  assert.equal(failedStorage.closeCount, 1);
  assert.deepEqual(harness.mounted, [[{ id: "recovered" }]]);
});

test("stopping startup prevents a late initialization from mounting", async () => {
  const deferred = createDeferred();
  const storage = createStorage({ initialize: () => deferred.promise });
  const harness = createHarness({ storages: [storage] });
  const startup = harness.coordinator.start();

  harness.coordinator.stop();
  deferred.resolve();
  await startup;

  assert.equal(storage.closeCount, 2);
  assert.deepEqual(harness.mounted, []);
  assert.deepEqual(harness.errors, []);
});
