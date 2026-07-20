import { assertStorageAdapter } from "./contracts/storage-contract.js";
import { createDebugStorage } from "./debug/debug-storage.js";
import { createIndexedDbStorage } from "./indexeddb/indexeddb-storage.js";

export function createAppStorage({
  indexedDBFactory = globalThis.indexedDB,
  isDebugMode
}) {
  const storage = isDebugMode
    ? createDebugStorage()
    : createIndexedDbStorage({ indexedDBFactory });

  return assertStorageAdapter(storage);
}
