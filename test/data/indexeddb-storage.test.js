import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAIN_MODEL_VERSION,
  INDEXES,
  OBJECT_STORES,
  upgradeDatabase
} from "../../src/data/indexeddb/database-schema.js";
import {
  createIndexedDbStorage
} from "../../src/data/indexeddb/indexeddb-storage.js";
import { openDatabase } from "../../src/data/indexeddb/connection.js";
import { requestToPromise } from "../../src/data/indexeddb/requests.js";
import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../../src/data/contracts/storage-contract.js";

function createFakeDatabase() {
  const stores = new Map();

  return {
    createObjectStore(name, options) {
      const indexes = new Map();
      const records = [];
      const store = {
        createIndex(indexName, keyPath, indexOptions = {}) {
          indexes.set(indexName, { keyPath, options: indexOptions });
        },
        indexes,
        options,
        put(record) {
          records.push(record);
        },
        records
      };

      stores.set(name, store);
      return store;
    },
    stores
  };
}

test("version 1 schema creates stable stores, indexes, and metadata", () => {
  const database = createFakeDatabase();

  upgradeDatabase(database, 0);

  assert.deepEqual([...database.stores.keys()].sort(), [...Object.values(OBJECT_STORES)].sort());
  assert.deepEqual(
    database.stores.get(OBJECT_STORES.fieldDefinitions).indexes.get(
      INDEXES.fieldDefinitionsByGoodsTypeAndKey
    ),
    {
      keyPath: ["goodsTypeId", "key"],
      options: { unique: true }
    }
  );
  assert.deepEqual(database.stores.get(OBJECT_STORES.metadata).records, [
    { key: "domainModelVersion", value: DOMAIN_MODEL_VERSION }
  ]);
});

test("schema upgrade does nothing when version 1 already exists", () => {
  const database = createFakeDatabase();

  upgradeDatabase(database, 1);

  assert.equal(database.stores.size, 0);
});

test("openDatabase reports unavailable IndexedDB", async () => {
  await assert.rejects(
    openDatabase({ indexedDBFactory: undefined }),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.unavailable
  );
});

test("IndexedDbStorage requires initialization before reads", async () => {
  const storage = createIndexedDbStorage({ indexedDBFactory: undefined });

  await assert.rejects(
    storage.listGoodsTypes(),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.notInitialized
  );
  await assert.rejects(
    storage.initialize(),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.unavailable
  );
});

test("requestToPromise resolves and rejects IDB-style requests", async () => {
  const successfulRequest = {};
  const successPromise = requestToPromise(successfulRequest);
  successfulRequest.result = { id: "result" };
  successfulRequest.onsuccess();

  assert.deepEqual(await successPromise, { id: "result" });

  const failedRequest = {};
  const failurePromise = requestToPromise(failedRequest);
  failedRequest.error = new Error("request failed");
  failedRequest.onerror();

  await assert.rejects(failurePromise, /request failed/);
});
