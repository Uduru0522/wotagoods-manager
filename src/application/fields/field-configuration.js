export const CUSTOM_FIELD_TYPES = Object.freeze([
  Object.freeze({ value: "text", label: "Text" }),
  Object.freeze({ value: "long_text", label: "Long text" }),
  Object.freeze({ value: "number", label: "Number" }),
  Object.freeze({ value: "date", label: "Date" }),
  Object.freeze({ value: "boolean", label: "Yes / No" }),
  Object.freeze({ value: "url", label: "Web address" }),
  Object.freeze({ value: "select", label: "Selection list" })
]);

const CUSTOM_FIELD_TYPE_VALUES = new Set(CUSTOM_FIELD_TYPES.map(({ value }) => value));

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function requireOptionLabels(value, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    throw new TypeError("Selection options must be an array.");
  }

  const labels = value.map((label) => requireNonEmptyString(label, "Selection option"));
  const normalizedLabels = labels.map(normalizeLabel);

  if (!allowEmpty && labels.length === 0) {
    throw new TypeError("A selection field requires at least one option.");
  }

  if (new Set(normalizedLabels).size !== labels.length) {
    throw new TypeError("Selection option labels must be unique.");
  }

  return labels;
}

export function assertCustomFieldType(value) {
  const dataType = requireNonEmptyString(value, "dataType");

  if (!CUSTOM_FIELD_TYPE_VALUES.has(dataType)) {
    throw new TypeError(`Unsupported custom field type: ${dataType}.`);
  }

  return dataType;
}

export function createUniqueFieldKey(displayName, existingKeys) {
  const baseKey = displayName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[0-9]/, "field_$&") || "field";
  let candidate = baseKey;
  let suffix = 2;

  while (existingKeys.has(candidate)) {
    candidate = `${baseKey}_${suffix}`;
    suffix += 1;
  }

  existingKeys.add(candidate);
  return candidate;
}

export function createSelectOptions(labels, generateId) {
  return {
    choices: requireOptionLabels(labels).map((label) => ({
      id: generateId(),
      label
    }))
  };
}

export function appendSelectOptions(currentOptions, newLabels, generateId) {
  const existingChoices = currentOptions?.choices;

  if (!Array.isArray(existingChoices)) {
    throw new TypeError("The existing selection field has invalid options.");
  }

  const additions = requireOptionLabels(newLabels, { allowEmpty: true });
  const usedLabels = new Set(existingChoices.map(({ label }) => normalizeLabel(label)));

  additions.forEach((label) => {
    if (usedLabels.has(normalizeLabel(label))) {
      throw new TypeError(`Selection option already exists: ${label}.`);
    }

    usedLabels.add(normalizeLabel(label));
  });

  return {
    choices: [
      ...existingChoices,
      ...additions.map((label) => ({ id: generateId(), label }))
    ]
  };
}
