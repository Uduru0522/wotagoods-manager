export function formatItemFieldValue(field, value) {
  if (value === undefined) {
    return "Not set";
  }

  if (field.dataType === "boolean") {
    return value ? "Yes" : "No";
  }

  if (field.dataType === "select") {
    return field.options.choices.find(({ id }) => id === value)?.label ?? "Unknown option";
  }

  return String(value);
}
