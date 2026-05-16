import { createElement } from "./dom.js";
import { createIcon } from "./icons.js";

function createNavigationItem(view, onSelect) {
  const button = createElement("button", {
    attributes: {
      "aria-label": view.label,
      title: view.label,
      type: "button"
    },
    className: "nav-item",
    dataset: { viewId: view.id }
  });
  const iconWrap = createElement("span", { className: "nav-icon" });
  const label = createElement("span", {
    className: "nav-label",
    textContent: view.label
  });

  iconWrap.append(createIcon(view.icon));
  button.append(iconWrap, label);
  button.addEventListener("click", () => onSelect(view.id));

  return button;
}

export function createNavigation({ container, onSelect, views }) {
  const buttons = new Map();

  function render() {
    const fragment = document.createDocumentFragment();

    views.forEach((view) => {
      const button = createNavigationItem(view, onSelect);
      buttons.set(view.id, button);
      fragment.append(button);
    });

    container.replaceChildren(fragment);
  }

  function setActiveView(viewId) {
    buttons.forEach((button, id) => {
      button.setAttribute("aria-current", id === viewId ? "page" : "false");
    });
  }

  return {
    render,
    setActiveView
  };
}
