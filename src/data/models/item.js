function requireRecord(value, fieldName = "Item") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${fieldName} must be an object.`);
  }

  return value;
}

function requireCanonicalString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
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
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => requireJsonValue(entry, fieldName));
  }

  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, requireJsonValue(entry, fieldName)])
    );
  }

  throw new TypeError(`${fieldName} must be JSON-compatible.`);
}

function requireCustomValues(value) {
  const customValues = requireRecord(value, "customValues");
  return requireJsonValue(customValues, "customValues");
}

export function parseItemRecord(value) {
  const input = requireRecord(value);
  const isDeleted = requireBoolean(input.isDeleted, "isDeleted");
  const createdAt = requireTimestamp(input.createdAt, "createdAt");
  const updatedAt = requireTimestamp(input.updatedAt, "updatedAt");

  if (updatedAt < createdAt) {
    throw new TypeError("updatedAt cannot be earlier than createdAt.");
  }

  if (isDeleted !== (input.deletedAt !== null)) {
    throw new TypeError("deletedAt must match the item deletion state.");
  }

  const deletedAt = isDeleted ? requireTimestamp(input.deletedAt, "deletedAt") : null;

  if (deletedAt && (deletedAt < createdAt || deletedAt > updatedAt)) {
    throw new TypeError("deletedAt must be between createdAt and updatedAt.");
  }

  return {
    id: requireCanonicalString(input.id, "id"),
    goodsTypeId: requireCanonicalString(input.goodsTypeId, "goodsTypeId"),
    name: requireCanonicalString(input.name, "name"),
    imageAssetId: input.imageAssetId === null
      ? null
      : requireCanonicalString(input.imageAssetId, "imageAssetId"),
    customValues: requireCustomValues(input.customValues),
    isDeleted,
    deletedAt,
    createdAt,
    updatedAt
  };
}

export function createItemRecord(input, { now = () => new Date().toISOString() } = {}) {
  const timestamp = now();
  const isDeleted = input.isDeleted ?? false;
  const updatedAt = input.updatedAt ?? timestamp;

  return parseItemRecord({
    ...input,
    id: input.id?.trim(),
    goodsTypeId: input.goodsTypeId?.trim(),
    name: input.name?.trim(),
    imageAssetId: input.imageAssetId?.trim() || null,
    customValues: input.customValues ?? {},
    isDeleted,
    deletedAt: isDeleted ? (input.deletedAt ?? updatedAt) : null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt
  });
}
