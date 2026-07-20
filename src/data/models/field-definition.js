const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export const FIELD_DATA_TYPES = Object.freeze([
  "boolean",
  "date",
  "image",
  "long_text",
  "number",
  "select",
  "text",
  "url"
]);

function requireRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Field definition must be an object.");
  }

  return value;
}

function requireCanonicalString(value, fieldName, { allowEmpty = false } = {}) {
  if (typeof value !== "string" || (!allowEmpty && value.trim() === "")) {
    throw new TypeError(`${fieldName} must be ${allowEmpty ? "a string" : "a non-empty string"}.`);
  }

  if (value.trim() !== value) {
    throw new TypeError(`${fieldName} cannot have leading or trailing whitespace.`);
  }

  return value;
}

function requireBoolean(value, fieldName) {
  if (typeof value !== "boolean") {
    throw new TypeError(`${fieldName} must be a boolean.`);
  }

  return value;
}

function requireTimestamp(value, fieldName) {
  if (
    typeof value !== "string" ||
    Number.isNaN(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  ) {
    throw new TypeError(`${fieldName} must be an ISO 8601 UTC timestamp.`);
  }

  return value;
}

function requireJsonValue(value, fieldName) {
  const isPrimitive =
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value));

  if (isPrimitive) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => requireJsonValue(item, fieldName));
  }

  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, requireJsonValue(item, fieldName)])
    );
  }

  throw new TypeError(`${fieldName} must be JSON-compatible.`);
}

function requireNullableObject(value, fieldName) {
  if (value !== null && (!value || typeof value !== "object" || Array.isArray(value))) {
    throw new TypeError(`${fieldName} must be an object or null.`);
  }

  return requireJsonValue(value, fieldName);
}

function requirePosition(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("position must be a non-negative safe integer.");
  }

  return value;
}

export function parseFieldDefinitionRecord(value) {
  const input = requireRecord(value);
  const key = requireCanonicalString(input.key, "key");
  const dataType = requireCanonicalString(input.dataType, "dataType");
  const isDeleted = requireBoolean(input.isDeleted, "isDeleted");
  const createdAt = requireTimestamp(input.createdAt, "createdAt");
  const updatedAt = requireTimestamp(input.updatedAt, "updatedAt");

  if (!FIELD_KEY_PATTERN.test(key)) {
    throw new TypeError("key must use lowercase snake_case.");
  }

  if (!FIELD_DATA_TYPES.includes(dataType)) {
    throw new TypeError(`Unsupported field data type: ${dataType}.`);
  }

  if (updatedAt < createdAt) {
    throw new TypeError("updatedAt cannot be earlier than createdAt.");
  }

  if (isDeleted !== (input.deletedAt !== null)) {
    throw new TypeError("deletedAt must match the field definition deletion state.");
  }

  const deletedAt = isDeleted
    ? requireTimestamp(input.deletedAt, "deletedAt")
    : null;

  if (deletedAt && (deletedAt < createdAt || deletedAt > updatedAt)) {
    throw new TypeError("deletedAt must be between createdAt and updatedAt.");
  }

  return {
    id: requireCanonicalString(input.id, "id"),
    goodsTypeId: requireCanonicalString(input.goodsTypeId, "goodsTypeId"),
    key,
    displayName: requireCanonicalString(input.displayName, "displayName"),
    dataType,
    isRequired: requireBoolean(input.isRequired, "isRequired"),
    isBuiltIn: requireBoolean(input.isBuiltIn, "isBuiltIn"),
    position: requirePosition(input.position),
    defaultValue: requireJsonValue(input.defaultValue, "defaultValue"),
    options: requireNullableObject(input.options, "options"),
    isDeleted,
    deletedAt,
    createdAt,
    updatedAt
  };
}

export function createFieldDefinitionRecord(
  input,
  { now = () => new Date().toISOString() } = {}
) {
  const timestamp = now();
  const isDeleted = input.isDeleted ?? false;
  const updatedAt = input.updatedAt ?? timestamp;

  return parseFieldDefinitionRecord({
    ...input,
    id: input.id?.trim(),
    goodsTypeId: input.goodsTypeId?.trim(),
    key: input.key?.trim(),
    displayName: input.displayName?.trim(),
    isRequired: input.isRequired ?? false,
    isBuiltIn: input.isBuiltIn ?? false,
    defaultValue: input.defaultValue ?? null,
    options: input.options ?? null,
    isDeleted,
    deletedAt: isDeleted ? (input.deletedAt ?? updatedAt) : null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt
  });
}
