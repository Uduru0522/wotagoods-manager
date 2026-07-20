import { createBuiltInFieldDefinitions } from "../../data/models/built-in-fields.js";
import { createGoodsTypeRecord } from "../../data/models/goods-type.js";

function defaultIdGenerator() {
  return globalThis.crypto.randomUUID();
}

export function createGoodsTypeCreationOperation({
  storage,
  generateId = defaultIdGenerator,
  now = () => new Date().toISOString()
}) {
  if (typeof storage?.createGoodsType !== "function") {
    throw new TypeError("Goods-type creation requires writable storage.");
  }

  return async function createGoodsType(input) {
    const timestamp = now();
    const goodsType = createGoodsTypeRecord(
      {
        id: generateId(),
        displayName: input.displayName,
        description: input.description?.trim() ?? ""
      },
      { now: () => timestamp }
    );
    const fieldDefinitions = createBuiltInFieldDefinitions({
      goodsTypeId: goodsType.id,
      generateId,
      now: () => timestamp
    });

    await storage.createGoodsType({ goodsType, fieldDefinitions });

    return structuredClone({ goodsType, fieldDefinitions });
  };
}
