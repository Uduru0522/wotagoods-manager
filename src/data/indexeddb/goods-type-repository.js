import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { OBJECT_STORES } from "./database-schema.js";
import { parseGoodsTypeRecord } from "../models/goods-type.js";
import { requestToPromise, transactionToPromise } from "./requests.js";

function sortByCreationTime(records) {
  return records.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export function createGoodsTypeRepository(database) {
  async function list({ includeDeleted = false } = {}) {
    let records;

    try {
      const transaction = database.transaction(OBJECT_STORES.goodsTypes, "readonly");
      const request = transaction.objectStore(OBJECT_STORES.goodsTypes).getAll();
      [records] = await Promise.all([
        requestToPromise(request),
        transactionToPromise(transaction)
      ]);
    } catch (error) {
      throw new StorageError(
        "Goods types could not be read from the local database.",
        {
          cause: error,
          code: STORAGE_ERROR_CODES.operationFailed
        }
      );
    }

    try {
      const parsedRecords = records.map(parseGoodsTypeRecord);
      const visibleRecords = includeDeleted
        ? parsedRecords
        : parsedRecords.filter((record) => !record.isDeleted);

      return structuredClone(sortByCreationTime(visibleRecords));
    } catch (error) {
      throw new StorageError(
        "The local database contains an invalid goods type record.",
        {
          cause: error,
          code: STORAGE_ERROR_CODES.invalidData
        }
      );
    }
  }

  return { list };
}
