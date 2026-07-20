import { createFieldDefinitionRecord } from "./field-definition.js";

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

export function createBuiltInFieldDefinitions({ goodsTypeId, generateId, now }) {
  return BUILT_IN_ITEM_FIELDS.map((field) =>
    createFieldDefinitionRecord(
      {
        ...field,
        id: generateId(field.key),
        goodsTypeId,
        isBuiltIn: true
      },
      { now }
    )
  );
}
