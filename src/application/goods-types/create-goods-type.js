import { createFieldDefinitionRecord } from "../../data/models/field-definition.js";
import { createGoodsTypeRecord } from "../../data/models/goods-type.js";

export const BUILT_IN_ITEM_FIELDS = Object.freeze([
  Object.freeze({
    key: "id",
    displayName: "ID",
    dataType: "text",
    isRequired: true,
    position: 0
  }),
  Object.freeze({
    key: "name",
    displayName: "Name",
    dataType: "text",
    isRequired: true,
    position: 1
  }),
  Object.freeze({
    key: "image",
    displayName: "Image",
    dataType: "image",
    isRequired: false,
    position: 2
  })
]);

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
    const fieldDefinitions = BUILT_IN_ITEM_FIELDS.map((field) =>
      createFieldDefinitionRecord(
        {
          ...field,
          id: generateId(),
          goodsTypeId: goodsType.id,
          isBuiltIn: true
        },
        { now: () => timestamp }
      )
    );

    await storage.createGoodsType({ goodsType, fieldDefinitions });

    return structuredClone({ goodsType, fieldDefinitions });
  };
}
