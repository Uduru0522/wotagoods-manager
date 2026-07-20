import {
  STORAGE_ERROR_CODES,
  StorageError
} from "../contracts/storage-contract.js";
import {
  createDebugFieldDefinitions,
  createDebugGoodsTypes
} from "./debug-fixtures.js";
import { parseFieldDefinitionRecord } from "../models/field-definition.js";
import { parseGoodsTypeRecord } from "../models/goods-type.js";

export function createDebugStorage({
  goodsTypes = createDebugGoodsTypes(),
  fieldDefinitions = createDebugFieldDefinitions(goodsTypes)
} = {}) {
  const records = goodsTypes.map(parseGoodsTypeRecord);
  const fieldRecords = fieldDefinitions.map(parseFieldDefinitionRecord);
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

  async function createGoodsType({ goodsType, fieldDefinitions: newFields }) {
    assertInitialized();

    let parsedGoodsType;
    let parsedFields;

    try {
      parsedGoodsType = parseGoodsTypeRecord(goodsType);
      parsedFields = newFields.map(parseFieldDefinitionRecord);
    } catch (error) {
      throw new StorageError("The goods type write contains invalid data.", {
        cause: error,
        code: STORAGE_ERROR_CODES.invalidData
      });
    }

    const existingIds = new Set([
      ...records.map(({ id }) => id),
      ...fieldRecords.map(({ id }) => id)
    ]);
    const newIds = [parsedGoodsType.id, ...parsedFields.map(({ id }) => id)];
    const fieldKeys = parsedFields.map(({ key }) => key);

    if (parsedFields.some(({ goodsTypeId }) => goodsTypeId !== parsedGoodsType.id)) {
      throw new StorageError("A field definition belongs to a different goods type.", {
        code: STORAGE_ERROR_CODES.invalidData
      });
    }

    if (
      new Set(newIds).size !== newIds.length ||
      newIds.some((id) => existingIds.has(id)) ||
      new Set(fieldKeys).size !== fieldKeys.length
    ) {
      throw new StorageError("The goods type contains duplicate record identity.", {
        code: STORAGE_ERROR_CODES.operationFailed
      });
    }

    records.push(parsedGoodsType);
    fieldRecords.push(...parsedFields);

    return structuredClone(parsedGoodsType);
  }

  function close() {
    isInitialized = false;
  }

  return {
    close,
    createGoodsType,
    initialize,
    listGoodsTypes
  };
}
