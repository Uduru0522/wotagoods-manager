export function getItemDisplayData(item, fields) {
  const customFields = fields.filter((field) => !field.isBuiltIn);

  return {
    missingRequiredFields: customFields.filter(
      (field) => field.isRequired && !Object.hasOwn(item.customValues, field.id)
    ),
    fieldValues: customFields.map((field) => ({
      field,
      value: item.customValues[field.id]
    }))
  };
}
