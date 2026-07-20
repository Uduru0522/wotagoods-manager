import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import { DATABASE_NAME } from "./database-schema.js";
import { openDatabase } from "./connection.js";
import { createGoodsTypeRepository } from "./goods-type-repository.js";

export function createIndexedDbStorage({
  databaseName = DATABASE_NAME,
  indexedDBFactory = globalThis.indexedDB
} = {}) {
  let database = null;
  let goodsTypeRepository = null;
  let initializationPromise = null;

  function assertInitialized() {
    if (!database || !goodsTypeRepository) {
      throw new StorageError("IndexedDB storage has not been initialized.", {
        code: STORAGE_ERROR_CODES.notInitialized
      });
    }
  }

  async function initialize() {
    if (database) {
      return;
    }

    initializationPromise ??= openDatabase({ databaseName, indexedDBFactory });

    try {
      database = await initializationPromise;
      goodsTypeRepository = createGoodsTypeRepository(database);
      database.onversionchange = () => close();
    } finally {
      initializationPromise = null;
    }
  }

  async function listGoodsTypes(options) {
    assertInitialized();
    return goodsTypeRepository.list(options);
  }

  async function createGoodsType(bundle) {
    assertInitialized();
    return goodsTypeRepository.create(bundle);
  }

  function close() {
    database?.close();
    database = null;
    goodsTypeRepository = null;
  }

  return {
    close,
    createGoodsType,
    initialize,
    listGoodsTypes
  };
}
