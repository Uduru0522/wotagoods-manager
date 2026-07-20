function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function requireString(value, fieldName) {
  if (typeof value !== "string") {
    throw new TypeError(`${fieldName} must be a string.`);
  }

  return value;
}

export function createGoodsTypeRecord(input, { now = () => new Date().toISOString() } = {}) {
  const timestamp = now();
  const isDeleted = input.isDeleted ?? false;
  const updatedAt = input.updatedAt ?? timestamp;

  return {
    id: requireNonEmptyString(input.id, "id"),
    displayName: requireNonEmptyString(input.displayName, "displayName"),
    description: requireString(input.description ?? "", "description"),
    isDeleted,
    deletedAt: isDeleted ? (input.deletedAt ?? updatedAt) : null,
    createdAt: input.createdAt ?? timestamp,
    updatedAt
  };
}
