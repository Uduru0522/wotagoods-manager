import { createActionButton } from "../../shared/action-button.js";
import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";
import {
  MAX_UI_MOTION_MS,
  getAnimationDurationMs,
  prefersReducedMotion
} from "../../shared/motion.js";
import { createMetaList } from "../../shared/ui-components.js";
import { createItemEntryForm } from "./item-entry-form.js";
import { clearItemImageDraft } from "./item-image-field.js";
import { formatItemFieldValue } from "./item-value-format.js";

function createDraft() {
  return {
    customValues: {},
    image: null,
    imageSource: null,
    name: "",
    processedImageUrl: ""
  };
}

export function createItemEntryDialog({
  goodsType,
  itemManagement,
  mutationController,
  onCreated
}) {
  const dialog = createElement("dialog", {
    attributes: {
      "aria-labelledby": "itemEntryTitle"
    },
    className: "item-entry-dialog"
  });
  const header = createElement("header", { className: "item-entry-header" });
  const heading = createElement("h3", {
    attributes: { id: "itemEntryTitle" },
    textContent: `Add item to ${goodsType.displayName}`
  });
  const closeButton = createElement("button", {
    attributes: {
      "aria-label": "Close item entry",
      title: "Close",
      type: "button"
    },
    className: "item-entry-close"
  });
  const body = createElement("div", { className: "item-entry-body" });
  const contentTransition = createContentTransition(body, { animateInitial: true });
  let closeTimer = 0;
  let draft = createDraft();
  let fields = null;
  let isClosing = false;
  let isLoading = false;
  let isSaving = false;

  closeButton.append(createIcon("close"));
  header.append(heading, closeButton);
  dialog.append(header, body);

  function renderMessage(
    title,
    description,
    { className = "item-entry-status", showProgress = false } = {}
  ) {
    const status = createElement("div", { className });

    if (showProgress) {
      status.append(createElement("progress", { className: "creation-progress" }));
    }

    status.append(
      createElement("h4", { textContent: title }),
      createElement("p", { textContent: description })
    );
    contentTransition.replace(() => body.replaceChildren(status));
  }

  function renderEditor() {
    contentTransition.replace(() => {
      body.replaceChildren(
        createItemEntryForm({
          draft,
          fields,
          onReview: renderReview
        })
      );
    });
  }

  function renderReview(errorMessage = "") {
    const review = createElement("div", { className: "item-entry-review" });
    const headingBlock = createElement("div", { className: "form-heading" });
    const customFields = fields.filter((field) => !field.isBuiltIn);
    const nameField = fields.find((field) => field.isBuiltIn && field.key === "name");
    const values = [
      { label: nameField?.displayName ?? "Name", value: draft.name },
      ...customFields.map((field) => ({
        label: field.displayName,
        value: formatItemFieldValue(field, draft.customValues[field.id])
      }))
    ];
    const feedback = createElement("p", {
      attributes: { "aria-live": "polite" },
      className: errorMessage ? "form-error" : "form-feedback",
      textContent: errorMessage
    });
    const actions = createElement("div", { className: "form-actions" });
    const backButton = createActionButton("Back");
    const saveButton = createActionButton(errorMessage ? "Try again" : "Save item", {
      className: "primary-action"
    });

    headingBlock.append(
      createElement("h4", { textContent: "Review item" }),
      createElement("p", { textContent: "Confirm the values before saving them locally." })
    );
    if (draft.processedImageUrl) {
      review.append(
        createElement("img", {
          attributes: { alt: "Processed item image", src: draft.processedImageUrl },
          className: "item-review-image"
        })
      );
    }
    backButton.addEventListener("click", renderEditor);
    saveButton.addEventListener("click", saveItem);
    actions.append(backButton, saveButton);
    review.prepend(headingBlock);
    review.append(createMetaList(values), feedback, actions);
    contentTransition.replace(() => body.replaceChildren(review));
  }

  async function saveItem() {
    if (isSaving) {
      return;
    }

    isSaving = true;
    closeButton.disabled = true;
    renderMessage(
      "Saving item...",
      "Writing this item to local browser storage.",
      { showProgress: true }
    );

    try {
      await mutationController.run(async () => {
        const result = await itemManagement.createItem({
          goodsTypeId: goodsType.id,
          name: draft.name,
          customValues: draft.customValues,
          image: draft.image
        });
        await onCreated(result.item);
      });

      renderSuccess();
    } catch (error) {
      console.error("Item creation failed:", error);
      renderReview(
        "The item could not be saved. Your entries are still available; check browser storage and try again."
      );
    } finally {
      isSaving = false;
      closeButton.disabled = false;
    }
  }

  function renderSuccess() {
    const success = createElement("div", { className: "item-entry-success" });
    const actions = createElement("div", { className: "form-actions" });
    const doneButton = createActionButton("Done", { className: "primary-action" });
    const anotherButton = createActionButton("Add another");

    doneButton.addEventListener("click", () => {
      requestClose();
      clearItemImageDraft(draft);
      draft = createDraft();
    });
    anotherButton.addEventListener("click", () => {
      clearItemImageDraft(draft);
      draft = createDraft();
      renderEditor();
    });
    actions.append(anotherButton, doneButton);
    success.append(
      createElement("h4", { textContent: "Item saved" }),
      createElement("p", { textContent: `${draft.name} is now stored in this collection.` }),
      actions
    );
    contentTransition.replace(() => body.replaceChildren(success));
  }

  async function loadFields() {
    if (fields || isLoading) {
      return;
    }

    isLoading = true;
    renderMessage("Loading item fields...", "Reading the collection configuration.");

    try {
      fields = await itemManagement.getEntryFields(goodsType.id);
      renderEditor();
    } catch (error) {
      console.error("Item fields could not be loaded:", error);
      renderMessage(
        "Item fields could not be loaded",
        "Close this window and try again after checking browser storage access.",
        { className: "item-entry-status item-entry-error" }
      );
    } finally {
      isLoading = false;
    }
  }

  function finishClose() {
    if (!isClosing) {
      return;
    }

    globalThis.clearTimeout(closeTimer);
    dialog.removeEventListener("animationend", handleCloseAnimationEnd);
    isClosing = false;
    delete dialog.dataset.closing;
    dialog.close();
  }

  function handleCloseAnimationEnd(event) {
    if (event.target === dialog) {
      finishClose();
    }
  }

  function requestClose() {
    if (isClosing || isSaving || !dialog.open) {
      return;
    }

    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }

    isClosing = true;
    dialog.dataset.closing = "true";
    dialog.addEventListener("animationend", handleCloseAnimationEnd);
    closeTimer = globalThis.setTimeout(
      finishClose,
      getAnimationDurationMs(dialog, MAX_UI_MOTION_MS)
    );
  }

  closeButton.addEventListener("click", requestClose);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });

  return {
    dialog,
    open() {
      if (!dialog.open) {
        dialog.showModal();
        loadFields();
      }
    }
  };
}
