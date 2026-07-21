import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";
import { createItemBrowser } from "./item-browser.js";
import { createItemEntryDialog } from "./item-entry-dialog.js";

export function renderItemsView({ goodsType }, { itemManagement, mutationController }) {
  const article = createElement("article", { className: "items-view" });
  const addButton = createElement("button", {
    attributes: { type: "button" },
    className: "primary-action items-add-action"
  });
  const browser = createItemBrowser({
    goodsTypeId: goodsType.id,
    itemManagement
  });
  const itemEntry = createItemEntryDialog({
    goodsType,
    itemManagement,
    mutationController,
    onCreated: browser.refresh
  });

  addButton.append(
    createIcon("add"),
    createElement("span", { textContent: "Add item" })
  );
  addButton.addEventListener("click", itemEntry.open);
  article.append(browser.element, itemEntry.dialog);
  browser.refresh();
  return {
    content: article,
    destroy() {
      browser.destroy();
      itemEntry.destroy();
    },
    topbarAction: addButton
  };
}
