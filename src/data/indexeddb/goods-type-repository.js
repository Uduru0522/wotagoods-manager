import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { OBJECT_STORES } from "./database-schema.js";
import { requestToPromise, transactionToPromise } from "./requests.js";

function sortByCreationTime(records) {
  return records.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function createGoodsTypeRepository(database) {
  async function list({ includeDeleted = false } = {}) {
    try {
      const transaction = database.transaction(OBJECT_STORES.goodsTypes, "readonly");
      const request = transaction.objectStore(OBJECT_STORES.goodsTypes).getAll();
      const [records] = await Promise.all([
        requestToPromise(request),
        transactionToPromise(transaction)
      ]);
      const visibleRecords = includeDeleted
        ? records
        : records.filter((record) => !record.isDeleted);

      return structuredClone(sortByCreationTime(visibleRecords));
    } catch (error) {
      throw new StorageError(
        "Goods types could not be read from the local database.",
        {
          cause: error,
          code: STORAGE_ERROR_CODES.operationFailed
        }
      );
    }
  }

  return { list };
}
