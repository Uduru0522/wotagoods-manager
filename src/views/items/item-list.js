import { createElement } from "../../shared/dom.js";
import { formatItemFieldValue } from "./item-value-format.js";

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function createItemList(items, fields, { getAsset }) {
  if (items.length === 0) {
    const emptyState = createElement("section", { className: "items-empty-state" });
    emptyState.append(
      createElement("h4", { textContent: "No items to display" }),
      createElement("p", { textContent: "Items saved to this collection will appear here." })
    );
    return emptyState;
  }

  const list = createElement("div", {
    attributes: { "aria-label": "Collection items", role: "list" },
    className: "item-list"
  });
  const customFields = fields.filter((field) => !field.isBuiltIn);

  items.forEach((item) => {
    const row = createElement("article", {
      attributes: { role: "listitem" },
      className: "item-list-row"
    });
    const copy = createElement("div", { className: "item-list-copy" });
    const thumbnail = createElement("div", { className: "item-list-thumbnail" });
    const values = createElement("dl", { className: "item-list-values" });
    const visibleValues = customFields
      .filter((field) => Object.hasOwn(item.customValues, field.id))
      .map((field) => ({ field, value: item.customValues[field.id] }));

    copy.append(createElement("h4", { textContent: item.name }));
    visibleValues.forEach(({ field, value }) => {
      values.append(
        createElement("dt", { textContent: field.displayName }),
        createElement("dd", { textContent: formatItemFieldValue(field, value) })
      );
    });

    if (visibleValues.length > 0) {
      copy.append(values);
    }
    if (item.imageAssetId) {
      getAsset(item.imageAssetId)
        .then((asset) => {
          if (!asset) {
            return;
          }

          const imageUrl = URL.createObjectURL(asset.data);
          const image = createElement("img", {
            attributes: { alt: "", src: imageUrl }
          });
          image.addEventListener("load", () => URL.revokeObjectURL(imageUrl), { once: true });
          thumbnail.replaceChildren(image);
        })
        .catch((error) => console.warn("Item image could not be loaded:", error));
    }

    row.append(
      thumbnail,
      copy,
      createElement("time", {
        attributes: { datetime: item.updatedAt },
        textContent: formatUpdatedAt(item.updatedAt)
      })
    );
    list.append(row);
  });

  return list;
}
