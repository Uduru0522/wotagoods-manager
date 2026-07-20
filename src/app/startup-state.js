import { STORAGE_ERROR_CODES } from "../data/contracts/storage-contract.js";
import { createElement } from "../shared/dom.js";

function resetNavigation(elements) {
  elements.primaryNavList.replaceChildren();
  elements.utilityNavList.replaceChildren();
}

function setTitle(elements, section, title) {
  elements.viewSection.textContent = section;
  elements.viewTitle.textContent = title;
}

export function renderStartupLoading(elements) {
  const status = createElement("article", {
    attributes: {
      "aria-busy": "true",
      role: "status"
    },
    className: "placeholder startup-state"
  });

  status.append(
    createElement("h3", { textContent: "Opening your collection" }),
    createElement("p", { textContent: "Loading local data..." })
  );

  resetNavigation(elements);
  setTitle(elements, "Application", "Opening collection");
  elements.viewPanel.replaceChildren(status);
}

export function renderStartupError(elements, error, { onRetry }) {
  const isUpgradeBlocked = error?.code === STORAGE_ERROR_CODES.upgradeBlocked;
  const article = createElement("article", {
    attributes: { role: "alert" },
    className: "placeholder startup-state"
  });
  const actions = createElement("div", { className: "startup-actions" });
  const retryButton = createElement("button", {
    attributes: { type: "button" },
    className: "primary-action",
    textContent: "Retry"
  });

  retryButton.addEventListener("click", onRetry);
  actions.append(retryButton);
  article.append(
    createElement("h3", { textContent: "Your collection could not be opened" }),
    createElement("p", {
      textContent: isUpgradeBlocked
        ? "Close other Wotagoods tabs, then retry. Your saved data has not been changed."
        : "Local browser storage is unavailable or could not be initialized. Your saved data has not been changed."
    }),
    actions
  );

  resetNavigation(elements);
  setTitle(elements, "Application", "Storage unavailable");
  elements.viewPanel.replaceChildren(article);
}
