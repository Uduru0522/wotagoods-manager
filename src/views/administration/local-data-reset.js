import { createActionButton } from "../../shared/action-button.js";
import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";

const CONFIRMATION_TEXT = "RESET";

export function createLocalDataReset({ mutationController, onReset, resetLocalData }) {
  const container = createElement("section", {
    attributes: { "aria-label": "Reset local data" },
    className: "local-data-reset"
  });
  const contentTransition = createContentTransition(container);

  function renderLanding() {
    const copy = createElement("div", { className: "local-reset-copy" });
    const resetButton = createActionButton("Reset local data", {
      className: "danger-action"
    });

    copy.append(
      createElement("h3", { textContent: "Reset local data" }),
      createElement("p", {
        textContent:
          "Clear all collections, fields, items, and images currently loaded by this app. Exported files, offline app files, and appearance settings are not affected."
      })
    );
    resetButton.addEventListener("click", renderConfirmation);

    contentTransition.replace(() => {
      container.classList.add("local-reset-landing");
      container.classList.remove("local-reset-workflow");
      container.replaceChildren(copy, resetButton);
    });
  }

  function renderConfirmation() {
    const form = createElement("form", { className: "local-reset-confirmation" });
    const heading = createElement("div", { className: "form-heading" });
    const field = createElement("label", {
      attributes: { for: "resetConfirmation" },
      className: "editor-field"
    });
    const input = createElement("input", {
      attributes: {
        autocomplete: "off",
        id: "resetConfirmation",
        name: "resetConfirmation",
        spellcheck: "false",
        type: "text"
      }
    });
    const status = createElement("div", {
      attributes: { "aria-live": "polite" },
      className: "creation-status"
    });
    const actions = createElement("div", { className: "form-actions" });
    const cancelButton = createActionButton("Cancel");
    const confirmButton = createActionButton("Reset everything", {
      className: "danger-action",
      type: "submit"
    });

    confirmButton.disabled = true;
    heading.append(
      createElement("h3", { textContent: "Reset everything?" }),
      createElement("p", {
        textContent: "This cannot be undone inside the app. Type RESET to continue."
      })
    );
    field.append(
      createElement("strong", { textContent: "Confirmation" }),
      input,
      createElement("small", { textContent: `Enter ${CONFIRMATION_TEXT} exactly.` })
    );
    input.addEventListener("input", () => {
      confirmButton.disabled = input.value !== CONFIRMATION_TEXT;
    });
    cancelButton.addEventListener("click", renderLanding);
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (input.value !== CONFIRMATION_TEXT) {
        return;
      }

      input.disabled = true;
      cancelButton.disabled = true;
      confirmButton.disabled = true;
      confirmButton.textContent = "Resetting...";
      form.setAttribute("aria-busy", "true");
      status.replaceChildren(
        createElement("progress", { className: "creation-progress" }),
        createElement("span", { textContent: "Clearing local application data..." })
      );

      try {
        await mutationController.run(async () => {
          await resetLocalData();
          await onReset();
        });
      } catch (error) {
        console.error("Local application data could not be reset:", error);
        form.removeAttribute("aria-busy");
        input.disabled = false;
        cancelButton.disabled = false;
        confirmButton.disabled = input.value !== CONFIRMATION_TEXT;
        confirmButton.textContent = "Try reset again";
        status.replaceChildren(
          createElement("p", {
            className: "form-error",
            textContent:
              "The reset could not be completed. Existing local data has been left available."
          })
        );
      }
    });

    actions.append(cancelButton, confirmButton);
    form.append(heading, field, status, actions);
    contentTransition.replace(
      () => {
        container.classList.remove("local-reset-landing");
        container.classList.add("local-reset-workflow");
        container.replaceChildren(form);
      },
      { afterUpdate: () => input.focus() }
    );
  }

  renderLanding();
  return container;
}
