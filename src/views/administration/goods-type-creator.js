import { createActionButton } from "../../shared/action-button.js";
import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";
import {
  createMetaList,
  createRequiredMark
} from "../../shared/ui-components.js";

function normalizeDisplayName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function findSimilarGoodsType(goodsTypes, displayName) {
  const normalizedName = normalizeDisplayName(displayName);

  return goodsTypes.find(
    (goodsType) => normalizeDisplayName(goodsType.displayName) === normalizedName
  );
}

function createActions(...buttons) {
  const actions = createElement("div", { className: "form-actions" });
  actions.append(...buttons);
  return actions;
}

function createEditorField({ description, id, label, required = false, multiline = false }) {
  const field = createElement("label", {
    attributes: { for: id },
    className: "editor-field"
  });
  const labelRow = createElement("span", { className: "editor-label" });
  const input = createElement(multiline ? "textarea" : "input", {
    attributes: {
      id,
      name: id,
      ...(required ? { required: "" } : {}),
      ...(multiline ? { rows: "4" } : { type: "text" })
    }
  });

  labelRow.append(createElement("strong", { textContent: label }));

  if (required) {
    labelRow.append(createRequiredMark());
  }

  field.append(
    labelRow,
    input,
    createElement("small", { textContent: description })
  );

  return { field, input };
}

export function createGoodsTypeCreator({
  createGoodsType,
  goodsTypes,
  mutationController,
  onCreated
}) {
  const container = createElement("section", {
    attributes: { "aria-label": "Create goods type" },
    className: "goods-type-creator"
  });
  const contentTransition = createContentTransition(container);

  function renderLanding() {
    const copy = createElement("div");
    const addButton = createActionButton("Add goods type", {
      className: "primary-action"
    });

    copy.append(
      createElement("h3", { textContent: "Create a collection" }),
      createElement("p", {
        textContent:
          "Define a goods type first. Its item fields can be customized afterward."
      })
    );
    addButton.addEventListener("click", renderEditor);
    contentTransition.replace(() => {
      container.classList.add("creator-landing");
      container.classList.remove("creator-workflow");
      container.replaceChildren(copy, addButton);
    });
  }

  function renderEditor(draft = { description: "", displayName: "" }) {
    const form = createElement("form", { className: "goods-type-form" });
    const heading = createElement("div", { className: "form-heading" });
    const nameField = createEditorField({
      description: "Shown in navigation and collection views.",
      id: "goodsTypeDisplayName",
      label: "Display name",
      required: true
    });
    const descriptionField = createEditorField({
      description: "Optional context about the goods stored in this collection.",
      id: "goodsTypeDescription",
      label: "Description",
      multiline: true
    });
    const feedback = createElement("p", {
      attributes: { "aria-live": "polite" },
      className: "form-feedback"
    });
    const cancelButton = createActionButton("Cancel");
    const continueButton = createActionButton("Review", {
      className: "primary-action",
      type: "submit"
    });

    nameField.input.value = draft.displayName;
    descriptionField.input.value = draft.description;

    function syncNameValidity() {
      const isInvalid = !nameField.input.value.trim();

      nameField.input.toggleAttribute("data-invalid", isInvalid);
      nameField.input.setAttribute("aria-invalid", String(isInvalid));
    }

    syncNameValidity();

    heading.append(
      createElement("h3", { textContent: "New goods type" }),
      createElement("p", {
        textContent: "Enter the collection details. No database change is made yet."
      })
    );
    cancelButton.addEventListener("click", renderLanding);
    nameField.input.addEventListener("input", () => {
      syncNameValidity();
      feedback.textContent = "";
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const nextDraft = {
        displayName: nameField.input.value.trim(),
        description: descriptionField.input.value.trim()
      };

      if (!nextDraft.displayName) {
        syncNameValidity();
        feedback.textContent = "Enter a display name before continuing.";
        nameField.input.focus();
        return;
      }

      renderReview(nextDraft);
    });

    form.append(
      heading,
      nameField.field,
      descriptionField.field,
      feedback,
      createActions(cancelButton, continueButton)
    );
    contentTransition.replace(
      () => {
        container.classList.remove("creator-landing");
        container.classList.add("creator-workflow");
        container.replaceChildren(form);
      },
      { afterUpdate: () => nameField.input.focus() }
    );
  }

  function renderReview(draft) {
    const review = createElement("div", { className: "goods-type-review" });
    const heading = createElement("div", { className: "form-heading" });
    const similarGoodsType = findSimilarGoodsType(goodsTypes, draft.displayName);
    const status = createElement("div", {
      attributes: { "aria-live": "polite" },
      className: "creation-status"
    });
    const backButton = createActionButton("Back");
    const confirmButton = createActionButton("Create goods type", {
      className: "primary-action"
    });

    heading.append(
      createElement("h3", { textContent: "Review goods type" }),
      createElement("p", {
        textContent:
          "Confirm these details before saving. Default fields are added automatically; custom fields can be configured afterward."
      })
    );
    review.append(
      heading,
      createMetaList([
        { label: "Display name", value: draft.displayName },
        { label: "Description", value: draft.description || "No description" }
      ])
    );

    if (similarGoodsType) {
      review.append(
        createElement("p", {
          className: "form-warning",
          textContent: `A goods type named "${similarGoodsType.displayName}" already exists. You can still create another.`
        })
      );
    }

    backButton.addEventListener("click", () => renderEditor(draft));
    confirmButton.addEventListener("click", async () => {
      let wasSaved = false;

      backButton.disabled = true;
      confirmButton.disabled = true;
      confirmButton.textContent = "Creating...";
      review.toggleAttribute("aria-busy", true);
      status.replaceChildren(
        createElement("progress", { className: "creation-progress" }),
        createElement("span", { textContent: "Saving to this browser..." })
      );

      try {
        await mutationController.run(async () => {
          const result = await createGoodsType(draft);
          wasSaved = true;
          await onCreated(result.goodsType.id);
        });
      } catch (error) {
        console.error("Goods type creation failed:", error);
        review.removeAttribute("aria-busy");

        if (wasSaved) {
          const reloadButton = createActionButton("Reload application", {
            className: "primary-action"
          });

          reloadButton.addEventListener("click", () => window.location.reload());
          confirmButton.replaceWith(reloadButton);
        } else {
          backButton.disabled = false;
          confirmButton.disabled = false;
          confirmButton.textContent = "Try again";
        }

        status.replaceChildren(
          createElement("p", {
            className: "form-error",
            textContent: wasSaved
              ? "The goods type was saved, but the screen could not refresh. Reload the application to continue."
              : "The goods type could not be created. Your entries are still here; check browser storage access and try again."
          })
        );
      }
    });

    review.append(status, createActions(backButton, confirmButton));
    contentTransition.replace(() => {
      container.classList.remove("creator-landing");
      container.classList.add("creator-workflow");
      container.replaceChildren(review);
    });
  }

  renderLanding();
  return container;
}
