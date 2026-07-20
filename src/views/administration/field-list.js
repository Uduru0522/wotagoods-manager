import { CUSTOM_FIELD_TYPES } from "../../application/fields/field-configuration.js";
import { FIELD_CHANGE_KINDS } from "../../application/fields/manage-fields.js";
import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";

const TYPE_LABELS = new Map(CUSTOM_FIELD_TYPES.map(({ label, value }) => [value, label]));
TYPE_LABELS.set("image", "Image");

function createToolButton(iconName, label, onClick, { disabled = false } = {}) {
  const button = createElement("button", {
    attributes: {
      "aria-label": label,
      title: label,
      type: "button"
    },
    className: "field-tool-button"
  });

  button.disabled = disabled;
  button.append(createIcon(iconName));
  button.addEventListener("click", onClick);
  return button;
}

export function createFieldList({ fields, onEdit, onMove, onRemove }) {
  const list = createElement("div", { className: "field-list" });
  const activeCustomFields = fields.filter(
    ({ isBuiltIn, stagedKind }) => !isBuiltIn && stagedKind !== FIELD_CHANGE_KINDS.delete
  );

  fields.forEach((field) => {
    const row = createElement("div", {
      className: `field-row${field.stagedKind ? ` is-${field.stagedKind}` : ""}`
    });
    const identity = createElement("div", { className: "field-row-identity" });
    const metadata = createElement("div", { className: "field-row-metadata" });
    const actions = createElement("div", { className: "field-row-actions" });

    identity.append(
      createElement("strong", { textContent: field.displayName }),
      createElement("span", {
        className: "field-type-label",
        textContent: TYPE_LABELS.get(field.dataType) ?? field.dataType
      })
    );
    metadata.append(
      createElement("span", {
        textContent: field.isRequired ? "Required" : "Optional"
      })
    );

    if (field.stagedKind) {
      metadata.append(
        createElement("span", {
          className: "field-stage-badge",
          textContent: field.stagedKind === FIELD_CHANGE_KINDS.delete
            ? "Staged removal"
            : field.stagedKind === FIELD_CHANGE_KINDS.add
              ? "Staged addition"
              : "Staged edit"
        })
      );
    }

    if (field.isBuiltIn) {
      actions.append(
        createToolButton("lock", "Protected field", () => {}, { disabled: true })
      );
    } else if (field.stagedKind === FIELD_CHANGE_KINDS.delete) {
      actions.append(
        createElement("span", {
          className: "field-removal-note",
          textContent: "Applied after review"
        })
      );
    } else {
      const orderIndex = activeCustomFields.findIndex(({ id }) => id === field.id);

      actions.append(
        createToolButton(
          "moveUp",
          "Move field up",
          () => onMove(field, -1),
          { disabled: orderIndex === 0 }
        ),
        createToolButton(
          "moveDown",
          "Move field down",
          () => onMove(field, 1),
          { disabled: orderIndex === activeCustomFields.length - 1 }
        ),
        createToolButton("edit", "Edit field", () => onEdit(field)),
        createToolButton(
          "delete",
          field.stagedKind === FIELD_CHANGE_KINDS.add
            ? "Remove staged field"
            : "Remove field",
          () => onRemove(field)
        )
      );
    }

    row.append(identity, metadata, actions);
    list.append(row);
  });

  return list;
}
