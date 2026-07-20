import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { OBJECT_STORES } from "./database-schema.js";
import { requestToPromise, transactionToPromise } from "./requests.js";

export const USER_DATA_STORES = Object.freeze([
  OBJECT_STORES.goodsTypes,
  OBJECT_STORES.fieldDefinitions,
  OBJECT_STORES.items,
  OBJECT_STORES.assets
]);

export function createLocalDataRepository(database) {
  async function reset() {
    try {
      const transaction = database.transaction(USER_DATA_STORES, "readwrite");
      const requests = USER_DATA_STORES.map((storeName) =>
        requestToPromise(transaction.objectStore(storeName).clear())
      );

      await Promise.all([...requests, transactionToPromise(transaction)]);
    } catch (error) {
      throw new StorageError("Local application data could not be reset.", {
        cause: error,
        code: STORAGE_ERROR_CODES.operationFailed
      });
    }
  }

  return { reset };
}
