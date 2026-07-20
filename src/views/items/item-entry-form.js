import { createActionButton } from "../../shared/action-button.js";
import { createElement } from "../../shared/dom.js";
import { normalizeHttpsUrl } from "../../application/items/manage-items.js";
import {
  createItemImageField,
  prepareItemImage
} from "./item-image-field.js";

function createRequiredMark() {
  return createElement("span", {
    attributes: { "aria-label": "Required" },
    className: "required-mark",
    textContent: "!"
  });
}

function createFieldLabel(field, input) {
  const wrapper = createElement("label", { className: "editor-field item-form-field" });
  const labelRow = createElement("span", { className: "editor-label" });

  labelRow.append(createElement("strong", { textContent: field.displayName }));
  if (field.isRequired) {
    labelRow.append(createRequiredMark());
  }
  wrapper.append(labelRow, input);
  return wrapper;
}

function createSelectInput(field) {
  const select = createElement("select", {
    attributes: field.isRequired ? { required: "" } : {}
  });

  select.append(createElement("option", { attributes: { value: "" }, textContent: "Not set" }));
  field.options.choices.forEach((choice) => {
    select.append(
      createElement("option", {
        attributes: { value: choice.id },
        textContent: choice.label
      })
    );
  });
  return select;
}

function createBooleanInput() {
  return createElement("input", {
    attributes: { role: "switch", type: "checkbox" },
    className: "switch-input item-boolean-input"
  });
}

function createFieldControl(field) {
  if (field.dataType === "long_text") {
    return createElement("textarea", {
      attributes: {
        rows: "4",
        ...(field.isRequired ? { required: "" } : {})
      }
    });
  }

  if (field.dataType === "select") {
    return createSelectInput(field);
  }

  if (field.dataType === "boolean") {
    return createBooleanInput(field);
  }

  const inputTypes = {
    date: "date",
    number: "number",
    text: "text",
    url: "text"
  };

  return createElement("input", {
    attributes: {
      type: inputTypes[field.dataType] ?? "text",
      ...(field.dataType === "url" ? { inputmode: "url" } : {}),
      ...(field.dataType === "number" ? { step: "any" } : {}),
      ...(field.isRequired ? { required: "" } : {})
    }
  });
}

function readControlValue(field, control) {
  if (field.dataType === "boolean") {
    return control.checked;
  }

  if (control.value === "") {
    return undefined;
  }

  if (field.dataType === "number") {
    return control.valueAsNumber;
  }

  return control.value;
}

function setControlValue(field, control, value) {
  if (field.dataType === "boolean") {
    control.checked = value === true;
    return;
  }

  if (value === undefined || value === null) {
    control.value = "";
    return;
  }

  control.value = value;
}

export function createItemEntryForm({ draft, fields, onReview }) {
  const form = createElement("form", { className: "item-entry-form" });
  const heading = createElement("div", { className: "form-heading" });
  const fieldGrid = createElement("div", { className: "item-form-fields" });
  const nameField = fields.find((field) => field.isBuiltIn && field.key === "name") ?? {
    displayName: "Name",
    isRequired: true
  };
  const nameInput = createElement("input", {
    attributes: { autocomplete: "off", required: "", type: "text" }
  });
  const customFields = fields.filter((field) => !field.isBuiltIn);
  const imageField = fields.find((field) => field.isBuiltIn && field.key === "image");
  const controls = new Map();
  const feedback = createElement("p", {
    attributes: { "aria-live": "polite" },
    className: "form-feedback"
  });
  const reviewButton = createActionButton("Review item", {
    className: "primary-action",
    type: "submit"
  });
  const actions = createElement("div", { className: "form-actions" });

  nameInput.value = draft.name;
  fieldGrid.append(
    createFieldLabel(nameField, nameInput),
    createItemImageField({ draft, field: imageField })
  );

  customFields.forEach((field) => {
    const control = createFieldControl(field);
    controls.set(field.id, control);
    setControlValue(
      field,
      control,
      draft.customValues[field.id] ?? field.defaultValue
    );
    fieldGrid.append(createFieldLabel(field, control));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    customFields
      .filter((field) => field.dataType === "url")
      .forEach((field) => {
        const control = controls.get(field.id);
        control.setCustomValidity("");

        if (!control.value.trim()) {
          return;
        }

        try {
          control.value = normalizeHttpsUrl(control.value, field.displayName);
        } catch (error) {
          control.setCustomValidity(error.message);
        }
      });

    if (!form.reportValidity()) {
      return;
    }

    const customValues = Object.fromEntries(
      customFields.flatMap((field) => {
        const value = readControlValue(field, controls.get(field.id));
        return value === undefined ? [] : [[field.id, value]];
      })
    );

    draft.name = nameInput.value.trim();
    draft.customValues = customValues;
    feedback.textContent = "";
    reviewButton.disabled = true;
    reviewButton.textContent = draft.imageSource ? "Processing image..." : "Preparing review...";

    try {
      await prepareItemImage(draft);
      onReview();
    } catch (error) {
      feedback.textContent = "The selected image could not be processed. Choose another image and try again.";
      reviewButton.disabled = false;
      reviewButton.textContent = "Review item";
    }
  });

  actions.append(reviewButton);
  heading.append(
    createElement("h4", { textContent: "Item information" }),
    createElement("p", {
      textContent: "Required fields are marked with an exclamation point."
    })
  );
  form.append(
    heading,
    fieldGrid,
    feedback,
    actions
  );
  requestAnimationFrame(() => nameInput.focus());

  return form;
}
