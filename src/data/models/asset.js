function requireRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Asset must be an object.");
  }

  return value;
}

function requireCanonicalString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "" || value.trim() !== value) {
    throw new TypeError(`${fieldName} must be a canonical non-empty string.`);
  }

  return value;
}

function requirePositiveInteger(value, fieldName) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${fieldName} must be a positive integer.`);
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

export function parseAssetRecord(value) {
  const input = requireRecord(value);
  const mediaType = requireCanonicalString(input.mediaType, "mediaType");
  const createdAt = requireTimestamp(input.createdAt, "createdAt");
  const updatedAt = requireTimestamp(input.updatedAt, "updatedAt");

  if (!(input.data instanceof Blob) || !mediaType.startsWith("image/")) {
    throw new TypeError("Asset data must be an image Blob.");
  }

  if (input.data.type && input.data.type !== mediaType) {
    throw new TypeError("Asset Blob type must match mediaType.");
  }

  if (updatedAt < createdAt) {
    throw new TypeError("updatedAt cannot be earlier than createdAt.");
  }

  const byteSize = requirePositiveInteger(input.byteSize, "byteSize");

  if (byteSize !== input.data.size) {
    throw new TypeError("byteSize must match the Blob size.");
  }

  return {
    id: requireCanonicalString(input.id, "id"),
    data: input.data,
    mediaType,
    width: requirePositiveInteger(input.width, "width"),
    height: requirePositiveInteger(input.height, "height"),
    byteSize,
    createdAt,
    updatedAt
  };
}

export function createAssetRecord(input, { now = () => new Date().toISOString() } = {}) {
  const timestamp = now();

  return parseAssetRecord({
    ...input,
    id: input.id?.trim(),
    mediaType: input.mediaType?.trim(),
    byteSize: input.data?.size,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: input.updatedAt ?? timestamp
  });
}
