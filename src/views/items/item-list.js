import { createElement } from "../../shared/dom.js";
import { getItemDisplayData } from "./item-display-model.js";
import { createItemDisplayValue } from "./item-display-value.js";
import { createMissingFieldsWarning } from "./item-missing-warning.js";
import { createItemThumbnail } from "./item-thumbnail.js";

function createEmptyState() {
  const element = createElement("section", { className: "items-empty-state" });
  element.append(
    createElement("h4", { textContent: "No items to display" }),
    createElement("p", { textContent: "Items saved to this collection will appear here." })
  );
  return { destroy() {}, element };
}

function createFieldValues(fieldValues) {
  const values = createElement("dl", { className: "item-list-values" });

  fieldValues.forEach(({ field, value }) => {
    const description = createElement("dd");
    description.append(createItemDisplayValue(field, value));
    values.append(
      createElement("dt", {
        attributes: { title: field.displayName },
        textContent: field.displayName
      }),
      description
    );
  });
  return values;
}

function createItemListRow(item, fields, getAsset) {
  const element = createElement("article", {
    attributes: { role: "listitem" },
    className: "item-list-row"
  });
  const copy = createElement("div", { className: "item-list-copy" });
  const title = createElement("h4");
  const itemName = createElement("span", {
    className: "item-list-name",
    textContent: item.name
  });
  const { fieldValues, missingRequiredFields } = getItemDisplayData(item, fields);
  const thumbnail = createItemThumbnail(item, getAsset);
  let updateWarning = null;

  title.append(itemName);
  if (missingRequiredFields.length > 0) {
    const warning = createMissingFieldsWarning(missingRequiredFields, title, itemName);
    updateWarning = warning.updateLayout;
    title.append(warning.element);
  }
  copy.append(title);

  if (fieldValues.length > 0) {
    copy.append(createFieldValues(fieldValues));
  }

  element.append(thumbnail.element, copy);
  return {
    destroy: thumbnail.destroy,
    element,
    updateWarning
  };
}

export function createItemList(items, fields, { getAsset }) {
  if (items.length === 0) {
    return createEmptyState();
  }

  const element = createElement("div", {
    attributes: { "aria-label": "Collection items", role: "list" },
    className: "item-list"
  });
  const rows = items.map((item) => createItemListRow(item, fields, getAsset));
  const warningUpdates = rows.flatMap(({ updateWarning }) =>
    updateWarning ? [updateWarning] : []
  );
  const updateWarnings = () => warningUpdates.forEach((update) => update());
  const resizeObserver = warningUpdates.length > 0 && typeof ResizeObserver === "function"
    ? new ResizeObserver(updateWarnings)
    : null;
  const animationFrame = warningUpdates.length > 0
    ? requestAnimationFrame(updateWarnings)
    : 0;

  element.append(...rows.map((row) => row.element));
  resizeObserver?.observe(element);

  return {
    element,
    destroy() {
      rows.forEach(({ destroy }) => destroy());
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrame);
    }
  };
}
