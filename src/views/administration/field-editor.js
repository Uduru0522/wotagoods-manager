import { CUSTOM_FIELD_TYPES } from "../../application/fields/manage-fields.js";
import { createElement } from "../../shared/dom.js";

function createLabel(text, input, description) {
  const label = createElement("label", { className: "editor-field" });
  const labelText = createElement("span", { className: "editor-label" });

  labelText.append(createElement("strong", { textContent: text }));
  label.append(labelText, input);

  if (description) {
    label.append(createElement("small", { textContent: description }));
  }

  return label;
}

function createButton(label, className = "secondary-action") {
  return createElement("button", {
    attributes: { type: "button" },
    className,
    textContent: label
  });
}

function parseOptionLabels(value) {
  return value
    .split(/\r?\n/)
    .map((label) => label.trim())
    .filter(Boolean);
}

export function createFieldEditor({ field, onCancel, onSave }) {
  const isDraft = field?.stagedKind === "add";
  const form = createElement("form", { className: "field-editor" });
  const heading = createElement("div", { className: "form-heading" });
  const nameInput = createElement("input", {
    attributes: {
      "aria-invalid": "false",
      required: "",
      type: "text"
    }
  });
  const typeSelect = createElement("select");
  const requiredInput = createElement("input", {
    attributes: { type: "checkbox" },
    className: "field-required-input"
  });
  const requiredRow = createElement("label", { className: "field-required-row" });
  const optionsArea = createElement("div", { className: "field-options-editor" });
  const feedback = createElement("p", {
    attributes: { "aria-live": "polite" },
    className: "form-feedback"
  });
  const cancelButton = createButton("Cancel");
  const stageButton = createElement("button", {
    attributes: { type: "submit" },
    className: "primary-action",
    textContent: isDraft ? "Stage field" : "Stage changes"
  });

  CUSTOM_FIELD_TYPES.forEach(({ label, value }) => {
    typeSelect.append(
      createElement("option", { attributes: { value }, textContent: label })
    );
  });

  nameInput.value = field?.displayName ?? "";
  typeSelect.value = field?.dataType ?? CUSTOM_FIELD_TYPES[0].value;
  typeSelect.disabled = Boolean(field && !isDraft);
  requiredInput.checked = field?.isRequired ?? false;
  requiredInput.disabled = Boolean(field && !isDraft && !field.originalIsRequired);

  requiredRow.append(
    requiredInput,
    createElement("span", {
      textContent: "Require a value when registering an item"
    })
  );
  heading.append(
    createElement("h4", { textContent: isDraft ? "Edit staged field" : field ? "Edit field" : "Add field" }),
    createElement("p", {
      textContent: "Changes remain local until the complete staged set is applied."
    })
  );

  function renderOptions() {
    optionsArea.replaceChildren();

    if (typeSelect.value !== "select") {
      return;
    }

    const existingChoices = isDraft
      ? []
      : (field?.options?.choices ?? []).map(({ label }) => label);
    const optionInput = createElement("textarea", {
      attributes: { rows: "4" }
    });

    optionInput.dataset.role = "option-labels";
    optionInput.value = isDraft
      ? (field?.options?.choices ?? []).map(({ label }) => label).join("\n")
      : (field?.addOptionLabels ?? []).join("\n");
    optionsArea.append(
      createLabel(
        isDraft || !field ? "Options" : "Additional options",
        optionInput,
        "Enter one option per line."
      )
    );

    if (existingChoices.length > 0) {
      optionsArea.prepend(
        createElement("p", {
          className: "existing-options",
          textContent: `Current options: ${existingChoices.join(", ")}`
        })
      );
    }
  }

  typeSelect.addEventListener("change", renderOptions);
  nameInput.addEventListener("input", () => {
    const isInvalid = !nameInput.value.trim();
    nameInput.toggleAttribute("data-invalid", isInvalid);
    nameInput.setAttribute("aria-invalid", String(isInvalid));
    feedback.textContent = "";
  });
  cancelButton.addEventListener("click", onCancel);
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const displayName = nameInput.value.trim();
    const optionLabels = parseOptionLabels(
      optionsArea.querySelector('[data-role="option-labels"]')?.value ?? ""
    );
    const normalizedOptionLabels = optionLabels.map((label) =>
      label.replace(/\s+/g, " ").toLocaleLowerCase()
    );

    if (!displayName) {
      nameInput.toggleAttribute("data-invalid", true);
      nameInput.setAttribute("aria-invalid", "true");
      feedback.textContent = "Enter a field name before staging this change.";
      nameInput.focus();
      return;
    }

    if (typeSelect.value === "select" && (isDraft || !field) && optionLabels.length === 0) {
      feedback.textContent = "Enter at least one option for a selection list.";
      return;
    }

    if (new Set(normalizedOptionLabels).size !== optionLabels.length) {
      feedback.textContent = "Selection option names must be unique.";
      return;
    }

    if (
      typeSelect.value === "select" &&
      field &&
      !isDraft &&
      (field.options?.choices ?? []).some(({ label }) =>
        normalizedOptionLabels.includes(label.replace(/\s+/g, " ").toLocaleLowerCase())
      )
    ) {
      feedback.textContent = "One of these selection options already exists.";
      return;
    }

    try {
      onSave({
        displayName,
        dataType: typeSelect.value,
        isRequired: requiredInput.checked,
        ...(typeSelect.value === "select"
          ? { [isDraft || !field ? "optionLabels" : "addOptionLabels"]: optionLabels }
          : {})
      });
    } catch (error) {
      feedback.textContent = error.message;
    }
  });

  const actions = createElement("div", { className: "form-actions" });
  actions.append(cancelButton, stageButton);
  form.append(
    heading,
    createLabel("Field name", nameInput, "Shown in item forms and detail views."),
    createLabel("Data type", typeSelect, field && !isDraft ? "Data type cannot be changed after creation." : "Controls input and validation."),
    requiredRow,
    optionsArea,
    feedback,
    actions
  );
  renderOptions();
  requestAnimationFrame(() => nameInput.focus());

  return form;
}
