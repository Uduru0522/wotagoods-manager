import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import {
  DATABASE_NAME,
  DATABASE_VERSION,
  OBJECT_STORES,
  upgradeDatabase
} from "./database-schema.js";

function createStorageError(message, code, cause) {
  return new StorageError(message, { cause, code });
}

export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export function openDatabase({
  databaseName = DATABASE_NAME,
  indexedDBFactory,
  version = DATABASE_VERSION
}) {
  if (!indexedDBFactory) {
    return Promise.reject(
      createStorageError(
        "IndexedDB is unavailable in this browser.",
        STORAGE_ERROR_CODES.unavailable
      )
    );
  }

  return new Promise((resolve, reject) => {
    let isSettled = false;
    let request;

    function rejectOnce(error) {
      if (!isSettled) {
        isSettled = true;
        reject(error);
      }
    }

    try {
      request = indexedDBFactory.open(databaseName, version);
    } catch (error) {
      rejectOnce(
        createStorageError(
          "The local database could not be opened.",
          STORAGE_ERROR_CODES.initializationFailed,
          error
        )
      );
      return;
    }

    request.onupgradeneeded = (event) => {
      try {
        upgradeDatabase(request.result, event.oldVersion);
      } catch (error) {
        request.transaction?.abort();
        rejectOnce(
          createStorageError(
            "The local database could not be upgraded.",
            STORAGE_ERROR_CODES.initializationFailed,
            error
          )
        );
      }
    };

    request.onerror = () => {
      rejectOnce(
        createStorageError(
          "The local database could not be opened.",
          STORAGE_ERROR_CODES.initializationFailed,
          request.error
        )
      );
    };

    request.onblocked = () => {
      rejectOnce(
        createStorageError(
          "A different app tab is blocking the local database upgrade. Close other Wotagoods tabs and retry.",
          STORAGE_ERROR_CODES.upgradeBlocked
        )
      );
    };

    request.onsuccess = () => {
      if (isSettled) {
        request.result.close();
        return;
      }

      isSettled = true;
      resolve(request.result);
    };
  });
}

export function createIndexedDbStorage({
  databaseName = DATABASE_NAME,
  indexedDBFactory = globalThis.indexedDB
} = {}) {
  let database = null;
  let initializationPromise = null;

  function assertInitialized() {
    if (!database) {
      throw createStorageError(
        "IndexedDB storage has not been initialized.",
        STORAGE_ERROR_CODES.notInitialized
      );
    }
  }

  async function initialize() {
    if (database) {
      return;
    }

    initializationPromise ??= openDatabase({ databaseName, indexedDBFactory });

    try {
      database = await initializationPromise;
      database.onversionchange = () => {
        database?.close();
        database = null;
      };
    } finally {
      initializationPromise = null;
    }
  }

  async function listGoodsTypes({ includeDeleted = false } = {}) {
    assertInitialized();

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

      return structuredClone(
        visibleRecords.sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      );
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw createStorageError(
        "Goods types could not be read from the local database.",
        STORAGE_ERROR_CODES.operationFailed,
        error
      );
    }
  }

  function close() {
    database?.close();
    database = null;
  }

  return {
    close,
    initialize,
    listGoodsTypes
  };
}
