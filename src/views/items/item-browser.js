import { createContentTransition } from "../../shared/content-transition.js";
import { createElement } from "../../shared/dom.js";
import { createItemList } from "./item-list.js";

function createMessage(className, textContent) {
  return {
    destroy() {},
    element: createElement("p", { className, textContent })
  };
}

export function createItemBrowser({ goodsTypeId, itemManagement }) {
  const element = createElement("div", { className: "item-browser" });
  const transition = createContentTransition(element, { animateInitial: true });
  let activePresentation = null;
  let destroyed = false;
  let loadVersion = 0;

  function replacePresentation(createPresentation) {
    transition.replace(() => {
      if (destroyed) {
        return;
      }

      activePresentation?.destroy();
      activePresentation = createPresentation();
      element.replaceChildren(activePresentation.element);
    });
  }

  async function refresh() {
    if (destroyed) {
      return;
    }

    const requestedVersion = ++loadVersion;
    replacePresentation(() => createMessage("items-loading", "Loading items..."));

    try {
      const [items, fields] = await Promise.all([
        itemManagement.listItems(goodsTypeId),
        itemManagement.getEntryFields(goodsTypeId)
      ]);

      if (requestedVersion !== loadVersion) {
        return;
      }

      replacePresentation(() =>
        createItemList(items, fields, { getAsset: itemManagement.getAsset })
      );
    } catch (error) {
      if (requestedVersion !== loadVersion) {
        return;
      }

      console.error("Items could not be loaded:", error);
      replacePresentation(() => createMessage(
        "items-load-error",
        "Items could not be loaded. Check browser storage access and reopen this view."
      ));
    }
  }

  return {
    element,
    refresh,
    destroy() {
      destroyed = true;
      loadVersion += 1;
      transition.cancel();
      activePresentation?.destroy();
      activePresentation = null;
    }
  };
}
