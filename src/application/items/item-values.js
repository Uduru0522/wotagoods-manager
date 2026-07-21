function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function validateDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`${label} must be a valid date.`);
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.valueOf()) || parsedDate.toISOString().slice(0, 10) !== value) {
    throw new TypeError(`${label} must be a valid date.`);
  }

  return value;
}

export function normalizeHttpsUrl(value, label = "Web address") {
  const trimmedValue = value.trim();
  const normalizedValue = /^[a-z][a-z\d+.-]*:/i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;
  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new TypeError(`${label} must be a valid web address.`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw new TypeError(`${label} must use https.`);
  }

  return parsedUrl.href;
}

function validateFieldValue(field, value) {
  if (!hasValue(value)) {
    if (field.isRequired) {
      throw new TypeError(`${field.displayName} is required.`);
    }

    return undefined;
  }

  switch (field.dataType) {
    case "boolean":
      if (typeof value !== "boolean") {
        throw new TypeError(`${field.displayName} must be yes or no.`);
      }
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new TypeError(`${field.displayName} must be a number.`);
      }
      return value;
    case "date":
      if (typeof value !== "string") {
        throw new TypeError(`${field.displayName} must be a valid date.`);
      }
      return validateDate(value.trim(), field.displayName);
    case "url":
      if (typeof value !== "string") {
        throw new TypeError(`${field.displayName} must be a valid web address.`);
      }
      return normalizeHttpsUrl(value, field.displayName);
    case "select":
      if (!field.options.choices.some(({ id }) => id === value)) {
        throw new TypeError(`${field.displayName} has an invalid selection.`);
      }
      return value;
    case "long_text":
    case "text": {
      if (typeof value !== "string") {
        throw new TypeError(`${field.displayName} must be text.`);
      }
      const normalizedValue = value.trim();

      if (!normalizedValue) {
        if (field.isRequired) {
          throw new TypeError(`${field.displayName} is required.`);
        }
        return undefined;
      }

      return normalizedValue;
    }
    default:
      throw new TypeError(`Unsupported item field type: ${field.dataType}.`);
  }
}

export function normalizeItemValues(fields, submittedValues) {
  const customFields = fields.filter((field) => !field.isBuiltIn);
  const customFieldsById = new Map(customFields.map((field) => [field.id, field]));
  const submittedEntries = Object.entries(submittedValues ?? {});

  submittedEntries.forEach(([fieldId]) => {
    if (!customFieldsById.has(fieldId)) {
      throw new TypeError(`Unknown item field: ${fieldId}.`);
    }
  });

  return Object.fromEntries(
    customFields.flatMap((field) => {
      const submittedValue = submittedValues?.[field.id];
      const candidate = hasValue(submittedValue) ? submittedValue : field.defaultValue;
      const value = validateFieldValue(field, candidate);
      return value === undefined ? [] : [[field.id, value]];
    })
  );
}
