import { createElement } from "../../shared/dom.js";
import { createIcon } from "../../shared/icons.js";
import {
  MAX_UI_MOTION_MS,
  getAnimationDurationMs,
  prefersReducedMotion
} from "../../shared/motion.js";

export function createItemEntryDialog(goodsType) {
  const dialog = createElement("dialog", {
    attributes: {
      "aria-describedby": "itemEntryStatus",
      "aria-labelledby": "itemEntryTitle"
    },
    className: "item-entry-dialog"
  });
  const header = createElement("header", { className: "item-entry-header" });
  const heading = createElement("h3", {
    attributes: { id: "itemEntryTitle" },
    textContent: `Add item to ${goodsType.displayName}`
  });
  const closeButton = createElement("button", {
    attributes: {
      "aria-label": "Close item entry",
      title: "Close",
      type: "button"
    },
    className: "item-entry-close"
  });
  const body = createElement("div", { className: "item-entry-body" });
  let closeTimer = 0;
  let isClosing = false;

  closeButton.append(createIcon("close"));
  header.append(heading, closeButton);
  body.append(
    createElement("div", {
      attributes: { id: "itemEntryStatus", role: "status" },
      className: "item-entry-status"
    })
  );
  body.firstElementChild.append(
    createElement("h4", { textContent: "Item registration is not available yet." }),
    createElement("p", {
      textContent: "No local data will be changed from this preview."
    })
  );
  dialog.append(header, body);

  function finishClose() {
    if (!isClosing) {
      return;
    }

    globalThis.clearTimeout(closeTimer);
    dialog.removeEventListener("animationend", handleCloseAnimationEnd);
    isClosing = false;
    delete dialog.dataset.closing;
    dialog.close();
  }

  function handleCloseAnimationEnd(event) {
    if (event.target === dialog) {
      finishClose();
    }
  }

  function requestClose() {
    if (isClosing || !dialog.open) {
      return;
    }

    if (prefersReducedMotion()) {
      dialog.close();
      return;
    }

    isClosing = true;
    dialog.dataset.closing = "true";
    dialog.addEventListener("animationend", handleCloseAnimationEnd);
    closeTimer = globalThis.setTimeout(
      finishClose,
      getAnimationDurationMs(dialog, MAX_UI_MOTION_MS)
    );
  }

  closeButton.addEventListener("click", requestClose);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });

  return {
    dialog,
    open() {
      if (!dialog.open) {
        dialog.showModal();
      }
    }
  };
}
