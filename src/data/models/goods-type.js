function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function requireCanonicalNonEmptyString(value, fieldName) {
  const normalizedValue = requireNonEmptyString(value, fieldName);

  if (normalizedValue !== value) {
    throw new TypeError(`${fieldName} cannot have leading or trailing whitespace.`);
  }

  return value;
}

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} must be a string.`);
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

function requireRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Goods type must be an object.");
  }

  return value;
}

export function parseGoodsTypeRecord(value) {
  const input = requireRecord(value);
  const isDeleted = requireBoolean(input.isDeleted, "isDeleted");
  const createdAt = requireTimestamp(input.createdAt, "createdAt");
  const updatedAt = requireTimestamp(input.updatedAt, "updatedAt");

  if (updatedAt < createdAt) {
    throw new TypeError("updatedAt cannot be earlier than createdAt.");
  }

  if (isDeleted && input.deletedAt === null) {
    throw new TypeError("deletedAt is required when isDeleted is true.");
  }

  if (!isDeleted && input.deletedAt !== null) {
    throw new TypeError("deletedAt must be null when isDeleted is false.");
  }

  const deletedAt = isDeleted
    ? requireTimestamp(input.deletedAt, "deletedAt")
    : null;

  if (deletedAt && (deletedAt < createdAt || deletedAt > updatedAt)) {
    throw new TypeError("deletedAt must be between createdAt and updatedAt.");
  }

  return {
    id: requireCanonicalNonEmptyString(input.id, "id"),
    displayName: requireCanonicalNonEmptyString(input.displayName, "displayName"),
    description: requireString(input.description, "description"),
    isDeleted,
    deletedAt,
    createdAt,
    updatedAt
  };
}

export function createGoodsTypeRecord(input, { now = () => new Date().toISOString() } = {}) {
  const timestamp = now();
  const isDeleted = input.isDeleted ?? false;
  const updatedAt = input.updatedAt ?? timestamp;

  return parseGoodsTypeRecord({
    id: requireNonEmptyString(input.id, "id"),
    displayName: requireNonEmptyString(input.displayName, "displayName"),
    description: requireString(input.description ?? "", "description"),
    isDeleted,
    deletedAt: isDeleted ? (input.deletedAt ?? updatedAt) : null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt
  });
}
