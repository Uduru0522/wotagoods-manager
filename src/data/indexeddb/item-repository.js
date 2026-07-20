import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { parseItemRecord } from "../models/item.js";
import { INDEXES, OBJECT_STORES } from "./database-schema.js";
import { requestToPromise, transactionToPromise } from "./requests.js";

function sortByUpdatedTime(records) {
  return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createItemRepository(database) {
  async function create(item) {
    let parsedItem;

    try {
      parsedItem = parseItemRecord(item);
    } catch (error) {
      throw new StorageError("The item write contains invalid data.", {
        cause: error,
        code: STORAGE_ERROR_CODES.invalidData
      });
    }

    try {
      const transaction = database.transaction(OBJECT_STORES.items, "readwrite");
      const request = transaction.objectStore(OBJECT_STORES.items).add(parsedItem);

      await Promise.all([requestToPromise(request), transactionToPromise(transaction)]);
    } catch (error) {
      throw new StorageError("The item could not be saved to the local database.", {
        cause: error,
        code: STORAGE_ERROR_CODES.operationFailed
      });
    }

    return structuredClone(parsedItem);
  }

  async function list(goodsTypeId, { includeDeleted = false } = {}) {
    let records;

    try {
      const transaction = database.transaction(OBJECT_STORES.items, "readonly");
      const store = transaction.objectStore(OBJECT_STORES.items);
      const request = store.index(INDEXES.itemsByGoodsType).getAll(goodsTypeId);
      [records] = await Promise.all([
        requestToPromise(request),
        transactionToPromise(transaction)
      ]);
    } catch (error) {
      throw new StorageError("Items could not be read from the local database.", {
        cause: error,
        code: STORAGE_ERROR_CODES.operationFailed
      });
    }

    try {
      const parsedRecords = records.map(parseItemRecord);
      const visibleRecords = includeDeleted
        ? parsedRecords
        : parsedRecords.filter((record) => !record.isDeleted);

      return structuredClone(sortByUpdatedTime(visibleRecords));
    } catch (error) {
      throw new StorageError("The local database contains an invalid item record.", {
        cause: error,
        code: STORAGE_ERROR_CODES.invalidData
      });
    }
  }

  return { create, list };
}
