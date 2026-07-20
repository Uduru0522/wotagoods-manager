import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";
import { createItemEntryDialog } from "./item-entry-dialog.js";

export function renderItemsView({ goodsType }) {
  const article = createElement("article", { className: "items-view" });
  const toolbar = createElement("div", { className: "items-toolbar" });
  const copy = createElement("div");
  const addButton = createElement("button", {
    attributes: { type: "button" },
    className: "primary-action items-add-action"
  });
  const emptyState = createElement("section", { className: "items-empty-state" });
  const itemEntry = createItemEntryDialog(goodsType);

  copy.append(
    createElement("h3", { textContent: `${goodsType.displayName} items` }),
    createElement("p", {
      textContent: "Items registered in this collection will be managed here."
    })
  );
  addButton.append(
    createIcon("add"),
    createElement("span", { textContent: "Add item" })
  );
  addButton.addEventListener("click", itemEntry.open);
  toolbar.append(copy, addButton);
  emptyState.append(
    createElement("h4", { textContent: "No items to display" }),
    createElement("p", {
      textContent: "Items saved to this collection will appear here."
    })
  );
  article.append(toolbar, emptyState, itemEntry.dialog);

  return article;
}
