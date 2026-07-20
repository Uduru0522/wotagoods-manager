import { createElement } from "../../shared/dom.js";

function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function createItemList(items) {
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

  items.forEach((item) => {
    const row = createElement("article", {
      attributes: { role: "listitem" },
      className: "item-list-row"
    });
    const copy = createElement("div", { className: "item-list-copy" });

    copy.append(
      createElement("h4", { textContent: item.name }),
      createElement("p", {
        textContent: `${Object.keys(item.customValues).length} custom value${Object.keys(item.customValues).length === 1 ? "" : "s"}`
      })
    );
    row.append(
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
