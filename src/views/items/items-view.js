import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";
import { createItemEntryDialog } from "./item-entry-dialog.js";
import { createItemList } from "./item-list.js";

export function renderItemsView({ goodsType }, { itemManagement, mutationController }) {
  const article = createElement("article", { className: "items-view" });
  const toolbar = createElement("div", { className: "items-toolbar" });
  const copy = createElement("div");
  const addButton = createElement("button", {
    attributes: { type: "button" },
    className: "primary-action items-add-action"
  });
  const listSlot = createElement("div", { className: "items-list-slot" });
  const listTransition = createContentTransition(listSlot, { animateInitial: true });
  const itemEntry = createItemEntryDialog({
    goodsType,
    itemManagement,
    mutationController,
    onCreated: refreshItems
  });

  copy.append(
    createElement("h3", { textContent: `${goodsType.displayName} items` }),
    createElement("p", {
      textContent: "Browse and register items stored in this collection."
    })
  );
  addButton.append(
    createIcon("add"),
    createElement("span", { textContent: "Add item" })
  );
  addButton.addEventListener("click", itemEntry.open);
  toolbar.append(copy, addButton);
  article.append(toolbar, listSlot, itemEntry.dialog);

  async function refreshItems() {
    listTransition.replace(() => {
      listSlot.replaceChildren(
        createElement("p", { className: "items-loading", textContent: "Loading items..." })
      );
    });

    try {
      const [items, fields] = await Promise.all([
        itemManagement.listItems(goodsType.id),
        itemManagement.getEntryFields(goodsType.id)
      ]);
      listTransition.replace(() => listSlot.replaceChildren(
        createItemList(items, fields, { getAsset: itemManagement.getAsset })
      ));
    } catch (error) {
      console.error("Items could not be loaded:", error);
      listTransition.replace(() => {
        listSlot.replaceChildren(
          createElement("div", {
            className: "items-load-error",
            textContent: "Items could not be loaded. Check browser storage access and reopen this view."
          })
        );
      });
    }
  }

  refreshItems();
  return article;
}
