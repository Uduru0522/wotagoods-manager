import { createElement } from "../shared/dom.js";
import { createIcon } from "../shared/icons.js";

export function createNavButton(view, { className = "nav-item", onSelect }) {
  const button = createElement("button", {
    attributes: {
      "aria-label": view.label,
      title: view.label,
      type: "button"
    },
    className,
    dataset: { viewId: view.id }
  });
  const iconWrap = createElement("span", { className: "nav-icon" });
  const label = createElement("span", {
    className: "nav-label",
    textContent: view.label
  });

  iconWrap.append(createIcon(view.icon));
  button.append(iconWrap, label);
  button.addEventListener("click", () => onSelect(view));

  return button;
}

export function createNavSeparator() {
  return createElement("div", {
    attributes: { "aria-hidden": "true" },
    className: "nav-separator"
  });
}
