import assert from "node:assert/strict";
import test from "node:test";

import { createAppStorage } from "../../src/data/create-storage.js";
import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../../src/data/contracts/storage-contract.js";

test("createAppStorage keeps debug mode independent from IndexedDB", async () => {
  const storage = createAppStorage({
    indexedDBFactory: undefined,
    isDebugMode: true
  });

  await storage.initialize();

  assert.deepEqual(
    (await storage.listGoodsTypes()).map(({ displayName }) => displayName),
    ["Tapestries", "Figures", "Acrylic goods"]
  );
});

test("createAppStorage selects persistent storage for user mode", async () => {
  const storage = createAppStorage({
    indexedDBFactory: undefined,
    isDebugMode: false
  });

  await assert.rejects(
    storage.initialize(),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.unavailable
  );
});
