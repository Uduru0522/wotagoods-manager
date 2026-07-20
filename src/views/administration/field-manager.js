import { FIELD_CHANGE_KINDS } from "../../application/fields/manage-fields.js";
import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";
import { createFieldChangeReview } from "./field-change-review.js";
import { createFieldChangeSet } from "./field-change-set.js";
import { createFieldEditor } from "./field-editor.js";
import { createFieldList } from "./field-list.js";

function createButton(label, className = "secondary-action") {
  return createElement("button", {
    attributes: { type: "button" },
    className,
    textContent: label
  });
}

export function createFieldManager({ fieldManagement, goodsTypes, mutationController }) {
  const container = createElement("section", { className: "field-manager" });
  const contentTransition = createContentTransition(container);
  let selectedGoodsTypeId = goodsTypes[0]?.id ?? "";
  let baseFields = [];
  let changeSet = null;
  let draftNumber = 0;

  function assertUniqueDisplayName(displayName, excludedFieldId = null) {
    const normalizedName = displayName.trim().replace(/\s+/g, " ").toLocaleLowerCase();
    const duplicate = changeSet.getPreviewFields().find(
      (field) =>
        field.id !== excludedFieldId &&
        field.stagedKind !== FIELD_CHANGE_KINDS.delete &&
        field.displayName.trim().replace(/\s+/g, " ").toLocaleLowerCase() === normalizedName
    );

    if (duplicate) {
      throw new TypeError(`A field named "${duplicate.displayName}" already exists.`);
    }
  }

  function renderLanding(message = "") {
    const header = createElement("div", { className: "field-manager-header" });
    const controls = createElement("div", { className: "field-manager-controls" });
    const select = createElement("select", {
      attributes: { "aria-label": "Goods type" }
    });
    const openButton = createButton("Manage fields", "primary-action");

    goodsTypes.forEach((goodsType) => {
      select.append(
        createElement("option", {
          attributes: { value: goodsType.id },
          textContent: goodsType.displayName
        })
      );
    });
    select.value = selectedGoodsTypeId;
    select.disabled = goodsTypes.length === 0;
    openButton.disabled = goodsTypes.length === 0;
    select.addEventListener("change", () => {
      selectedGoodsTypeId = select.value;
    });
    openButton.addEventListener("click", loadFields);

    header.append(
      createElement("div", { className: "field-manager-copy" })
    );
    header.firstElementChild.append(
      createElement("h3", { textContent: "Manage item fields" }),
      createElement("p", {
        textContent: goodsTypes.length > 0
          ? "Choose a collection to configure the information stored for its items."
          : "Create a goods type before configuring item fields."
      })
    );
    controls.append(select, openButton);
    contentTransition.replace(() => {
      container.replaceChildren(header, controls);

      if (message) {
        container.append(
          createElement("p", { className: "field-manager-message", textContent: message })
        );
      }
    });
  }

  async function loadFields() {
    contentTransition.replace(() => {
      container.replaceChildren(
        createElement("div", {
          className: "field-manager-loading",
          textContent: "Loading fields..."
        })
      );
    });

    try {
      baseFields = await fieldManagement.listFields(selectedGoodsTypeId);
      changeSet = createFieldChangeSet(baseFields);
      renderWorkspace();
    } catch (error) {
      console.error("Field definitions could not be loaded:", error);
      renderLanding("Fields could not be loaded. Check browser storage access and try again.");
    }
  }

  function renderWorkspace(statusMessage = "") {
    const goodsType = goodsTypes.find(({ id }) => id === selectedGoodsTypeId);
    const workspace = createElement("div", { className: "field-manager-workspace" });
    const header = createElement("div", { className: "field-workspace-header" });
    const headerCopy = createElement("div");
    const chooseButton = createButton("Change collection");
    const addButton = createButton("Add field", "primary-action");
    const editorSlot = createElement("div", { className: "field-editor-slot" });
    const editorTransition = createContentTransition(editorSlot, { animateInitial: true });
    const footer = createElement("div", { className: "field-stage-footer" });
    const stageStatus = createElement("span", {
      textContent: `${changeSet.changeCount} staged change${changeSet.changeCount === 1 ? "" : "s"}`
    });
    const discardButton = createButton("Discard staged");
    const reviewButton = createButton("Review and apply", "primary-action");
    const previewFields = changeSet.getPreviewFields();

    headerCopy.append(
      createElement("h3", { textContent: `${goodsType.displayName} fields` }),
      createElement("p", {
        textContent: "Protected fields are fixed. Custom changes remain staged until review."
      })
    );
    chooseButton.addEventListener("click", () => {
      if (changeSet.changeCount > 0) {
        editorTransition.replace(() => {
          editorSlot.replaceChildren(
            createElement("p", {
              className: "form-warning",
              textContent: "Discard the staged changes before choosing another collection."
            })
          );
        });
        return;
      }

      renderLanding();
    });
    addButton.addEventListener("click", () => openAddEditor(editorSlot, editorTransition));
    header.append(headerCopy, chooseButton);

    const list = createFieldList({
      fields: previewFields,
      onEdit: (field) => openEditEditor(editorSlot, editorTransition, field),
      onMove: (field, direction) => {
        changeSet.move(field.id, direction);
        renderWorkspace();
      },
      onRemove: (field) => {
        if (field.stagedKind === FIELD_CHANGE_KINDS.add) {
          changeSet.removeDraft(field.id);
          renderWorkspace();
          return;
        }

        openDeleteConfirmation(editorSlot, editorTransition, field);
      }
    });

    discardButton.disabled = changeSet.changeCount === 0;
    reviewButton.disabled = changeSet.changeCount === 0;
    discardButton.addEventListener("click", () => {
      changeSet.reset();
      renderWorkspace("Staged changes discarded.");
    });
    reviewButton.addEventListener("click", renderReview);
    footer.append(stageStatus, discardButton, reviewButton);
    workspace.append(header, addButton, list, editorSlot, footer);

    if (statusMessage) {
      workspace.prepend(
        createElement("p", {
          attributes: { "aria-live": "polite" },
          className: "field-manager-success",
          textContent: statusMessage
        })
      );
    }

    contentTransition.replace(() => container.replaceChildren(workspace));
  }

  function openAddEditor(editorSlot, editorTransition) {
    const draftId = `field-draft-${++draftNumber}`;

    editorTransition.replace(() => {
      editorSlot.replaceChildren(
        createFieldEditor({
          field: null,
          onCancel: () => editorTransition.replace(() => editorSlot.replaceChildren()),
          onSave: (values) => {
            assertUniqueDisplayName(values.displayName);
            changeSet.stageAdd({ draftId, ...values });
            renderWorkspace();
          }
        })
      );
    });
  }

  function openEditEditor(editorSlot, editorTransition, field) {
    editorTransition.replace(() => {
      editorSlot.replaceChildren(
        createFieldEditor({
          field,
          onCancel: () => editorTransition.replace(() => editorSlot.replaceChildren()),
          onSave: (values) => {
            assertUniqueDisplayName(values.displayName, field.id);
            if (field.stagedKind === FIELD_CHANGE_KINDS.add) {
              changeSet.updateDraft(field.id, values);
            } else {
              changeSet.stageUpdate(field.id, values);
            }
            renderWorkspace();
          }
        })
      );
    });
  }

  function openDeleteConfirmation(editorSlot, editorTransition, field) {
    const confirmation = createElement("div", { className: "field-delete-confirmation" });
    const actions = createElement("div", { className: "form-actions" });
    const cancelButton = createButton("Cancel");
    const deleteButton = createButton("Stage removal", "danger-action");

    confirmation.append(
      createElement("h4", { textContent: `Remove ${field.displayName}?` }),
      createElement("p", {
        textContent: "This is a soft deletion. Existing item values are preserved for future restoration."
      })
    );
    cancelButton.addEventListener("click", () => {
      editorTransition.replace(() => editorSlot.replaceChildren());
    });
    deleteButton.addEventListener("click", () => {
      changeSet.stageDelete(field.id);
      renderWorkspace();
    });
    actions.append(cancelButton, deleteButton);
    confirmation.append(actions);
    editorTransition.replace(() => editorSlot.replaceChildren(confirmation));
  }

  function renderReview() {
    const changes = changeSet.getChanges();

    contentTransition.replace(() => {
      container.replaceChildren(
        createFieldChangeReview({
          baseFields,
          changes,
          fieldManagement,
          goodsTypeId: selectedGoodsTypeId,
          mutationController,
          onApplied: async () => {
            baseFields = await fieldManagement.listFields(selectedGoodsTypeId);
            changeSet = createFieldChangeSet(baseFields);
            renderWorkspace("Field changes applied.");
          },
          onBack: () => renderWorkspace()
        })
      );
    });
  }

  renderLanding();
  return container;
}
