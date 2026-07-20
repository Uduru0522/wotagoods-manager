import { createFieldDefinitionRecord } from "../../data/models/field-definition.js";

export const FIELD_CHANGE_KINDS = Object.freeze({
  add: "add",
  delete: "delete",
  update: "update"
});

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

function defaultIdGenerator() {
  return globalThis.crypto.randomUUID();
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${fieldName} must be a non-empty string.`);
  }

  return value.trim();
}

function normalizeLabel(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function createUniqueFieldKey(displayName, existingKeys) {
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

function createSelectOptions(labels, generateId) {
  return {
    choices: requireOptionLabels(labels).map((label) => ({
      id: generateId(),
      label
    }))
  };
}

function appendSelectOptions(currentOptions, newLabels, generateId) {
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

function sortFields(fields) {
  return fields.sort(
    (left, right) => left.position - right.position || left.createdAt.localeCompare(right.createdAt)
  );
}

function assertUniqueChangeTargets(changes) {
  const targets = changes.map((change) =>
    change.kind === FIELD_CHANGE_KINDS.add
      ? `draft:${requireNonEmptyString(change.draftId, "draftId")}`
      : `field:${requireNonEmptyString(change.fieldId, "fieldId")}`
  );

  if (new Set(targets).size !== targets.length) {
    throw new TypeError("Only one staged change is allowed per field.");
  }
}

export function createFieldManagementOperations({
  storage,
  generateId = defaultIdGenerator,
  now = () => new Date().toISOString()
}) {
  if (
    typeof storage?.listFieldDefinitions !== "function" ||
    typeof storage?.saveFieldDefinitions !== "function"
  ) {
    throw new TypeError("Field management requires field-definition storage.");
  }

  async function listFields(goodsTypeId) {
    return storage.listFieldDefinitions(requireNonEmptyString(goodsTypeId, "goodsTypeId"));
  }

  async function applyChanges({ goodsTypeId, changes }) {
    const canonicalGoodsTypeId = requireNonEmptyString(goodsTypeId, "goodsTypeId");

    if (!Array.isArray(changes) || changes.length === 0) {
      throw new TypeError("At least one staged field change is required.");
    }

    assertUniqueChangeTargets(changes);

    const timestamp = now();
    const allCurrentFields = await storage.listFieldDefinitions(canonicalGoodsTypeId, {
      includeDeleted: true
    });
    const currentFields = allCurrentFields.filter(({ isDeleted }) => !isDeleted);
    const currentById = new Map(allCurrentFields.map((field) => [field.id, field]));
    const resultingById = new Map(currentById);
    const existingKeys = new Set(allCurrentFields.map(({ key }) => key));
    const touchedIds = new Set();
    const requestedPositions = [];

    for (const change of changes) {
      if (change.kind === FIELD_CHANGE_KINDS.add) {
        const displayName = requireNonEmptyString(change.displayName, "displayName");
        const dataType = requireNonEmptyString(change.dataType, "dataType");

        if (!CUSTOM_FIELD_TYPE_VALUES.has(dataType)) {
          throw new TypeError(`Unsupported custom field type: ${dataType}.`);
        }

        const id = generateId();
        const record = createFieldDefinitionRecord(
          {
            id,
            goodsTypeId: canonicalGoodsTypeId,
            key: createUniqueFieldKey(displayName, existingKeys),
            displayName,
            dataType,
            isRequired: change.isRequired ?? false,
            position: Number.MAX_SAFE_INTEGER,
            options: dataType === "select"
              ? createSelectOptions(change.optionLabels, generateId)
              : null
          },
          { now: () => timestamp }
        );

        resultingById.set(id, record);
        touchedIds.add(id);
        continue;
      }

      if (![FIELD_CHANGE_KINDS.update, FIELD_CHANGE_KINDS.delete].includes(change.kind)) {
        throw new TypeError(`Unsupported field change kind: ${change.kind}.`);
      }

      const current = currentById.get(change.fieldId);

      if (!current || current.isDeleted) {
        throw new TypeError("The staged field no longer exists.");
      }

      if (current.isBuiltIn) {
        throw new TypeError("Built-in fields cannot be changed or deleted.");
      }

      if (change.kind === FIELD_CHANGE_KINDS.delete) {
        resultingById.set(
          current.id,
          createFieldDefinitionRecord({
            ...current,
            isDeleted: true,
            deletedAt: timestamp,
            updatedAt: timestamp
          })
        );
        touchedIds.add(current.id);
        continue;
      }

      const nextRequired = change.isRequired ?? current.isRequired;

      if (!current.isRequired && nextRequired) {
        throw new TypeError("Making an existing optional field required is deferred.");
      }

      const updated = createFieldDefinitionRecord({
        ...current,
        displayName: change.displayName ?? current.displayName,
        isRequired: nextRequired,
        options: change.addOptionLabels
          ? appendSelectOptions(current.options, change.addOptionLabels, generateId)
          : current.options,
        updatedAt: timestamp
      });

      resultingById.set(current.id, updated);
      touchedIds.add(current.id);

      if (change.position !== undefined) {
        if (!Number.isSafeInteger(change.position)) {
          throw new TypeError("Field position must be an integer.");
        }

        requestedPositions.push({ fieldId: current.id, position: change.position });
      }
    }

    const activeFields = sortFields(
      [...resultingById.values()].filter(({ isDeleted }) => !isDeleted)
    );
    const builtInCount = activeFields.filter(({ isBuiltIn }) => isBuiltIn).length;

    requestedPositions.forEach(({ fieldId, position }) => {
      const currentIndex = activeFields.findIndex(({ id }) => id === fieldId);
      const [field] = activeFields.splice(currentIndex, 1);
      const targetIndex = Math.max(builtInCount, Math.min(position, activeFields.length));
      activeFields.splice(targetIndex, 0, field);
    });

    activeFields.forEach((field, position) => {
      if (field.position === position) {
        return;
      }

      resultingById.set(
        field.id,
        createFieldDefinitionRecord({ ...field, position, updatedAt: timestamp })
      );
      touchedIds.add(field.id);
    });

    const normalizedNames = activeFields.map(({ id }) => ({
      id,
      name: normalizeLabel(resultingById.get(id).displayName)
    }));

    if (new Set(normalizedNames.map(({ name }) => name)).size !== normalizedNames.length) {
      throw new TypeError("Active field display names must be unique.");
    }

    const recordsToSave = [...touchedIds].map((id) => resultingById.get(id));
    await storage.saveFieldDefinitions({
      goodsTypeId: canonicalGoodsTypeId,
      fieldDefinitions: recordsToSave
    });

    return sortFields([...resultingById.values()].filter(({ isDeleted }) => !isDeleted));
  }

  return { applyChanges, listFields };
}
