import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { createDebugGoodsTypes } from "./debug-fixtures.js";
import { parseGoodsTypeRecord } from "../models/goods-type.js";

export function createDebugStorage({ goodsTypes = createDebugGoodsTypes() } = {}) {
  const records = goodsTypes.map(parseGoodsTypeRecord);
  let isInitialized = false;

  function assertInitialized() {
    if (!isInitialized) {
      throw new StorageError("Debug storage has not been initialized.", {
        code: STORAGE_ERROR_CODES.notInitialized
      });
    }
  }

  async function initialize() {
    isInitialized = true;
  }

  async function listGoodsTypes({ includeDeleted = false } = {}) {
    assertInitialized();

    const visibleRecords = includeDeleted
      ? records
      : records.filter((record) => !record.isDeleted);

    return structuredClone(visibleRecords);
  }

  function close() {
    isInitialized = false;
  }

  return {
    close,
    initialize,
    listGoodsTypes
  };
}
