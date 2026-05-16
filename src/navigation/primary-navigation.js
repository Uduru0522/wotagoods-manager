import { createElement } from "../shared/dom.js";
import { NAV_GROUPS, NAV_KINDS, VIEW_IDS } from "../views/view-metadata.js";
import { bindDragScroll } from "../shared/drag-scroll.js";
import { createNavButton, createNavSeparator } from "./nav-items.js";
import { bindScrollableRow } from "./scrollable-row.js";

const CHILD_NAV_BUTTON_CLASS = "nav-item nav-item-child";

function createEmptyGoodsNotice() {
  const note = createElement("p", {
    className: "nav-empty-note",
    textContent: "No goods types yet"
  });

  note.title = "Create a goods type in Administration.";

  return note;
}

function getViewChildren(views, parentId) {
  return views.filter(
    (view) => view.nav?.kind === NAV_KINDS.goodsChild && view.nav.parentId === parentId
  );
}

function groupViews(views) {
  const primaryViews = views.filter((view) => view.nav?.group === NAV_GROUPS.primary);

  return {
    administration: primaryViews.find((view) => view.id === VIEW_IDS.administration),
    dashboard: primaryViews.find((view) => view.id === VIEW_IDS.dashboard),
    goodsTypes: primaryViews.filter((view) => view.nav?.kind === NAV_KINDS.goodsType)
  };
}

export function createPrimaryNavigation({ container, onSelect, views }) {
  const buttons = new Map();
  const childGroups = new Map();
  let activeViewId = null;
  let expandedGoodsTypeId = null;

  function createTrackedButton(view, options = {}) {
    const button = createNavButton(view, {
      onSelect: handleSelect,
      ...options
    });

    buttons.set(view.id, button);

    return button;
  }

  function renderGoodsType(view, fragment) {
    const group = createElement("div", { className: "nav-group" });
    const childList = createElement("div", { className: "nav-child-list" });
    const button = createTrackedButton(view);

    childGroups.set(view.id, childList);
    group.append(button, childList);

    getViewChildren(views, view.id).forEach((childView) => {
      const childButton = createTrackedButton(childView, {
        className: CHILD_NAV_BUTTON_CLASS
      });

      childList.append(childButton);
    });

    fragment.append(group);
  }

  function render() {
    const fragment = document.createDocumentFragment();
    const { administration, dashboard, goodsTypes } = groupViews(views);

    buttons.clear();
    childGroups.clear();

    if (dashboard) {
      fragment.append(createTrackedButton(dashboard));
    }

    fragment.append(createNavSeparator());

    if (goodsTypes.length === 0) {
      fragment.append(createEmptyGoodsNotice());
    }

    goodsTypes.forEach((view) => renderGoodsType(view, fragment));

    if (administration) {
      fragment.append(createNavSeparator(), createTrackedButton(administration));
    }

    container.replaceChildren(fragment);
    bindDragScroll(container.parentElement, { axis: "y" });
    bindScrollableRow(container);
  }

  function syncActiveButtons(viewId) {
    buttons.forEach((button, id) => {
      button.setAttribute("aria-current", id === viewId ? "page" : "false");
    });
  }

  function syncChildGroups() {
    childGroups.forEach((childList, parentId) => {
      const isExpanded = parentId === expandedGoodsTypeId;
      childList.dataset.expanded = String(isExpanded);
      childList.setAttribute("aria-hidden", String(!isExpanded));
    });
  }

  function setActiveView(viewId) {
    const activeView = views.find((view) => view.id === viewId);

    activeViewId = viewId;
    expandedGoodsTypeId =
      activeView?.nav?.kind === NAV_KINDS.goodsChild ? activeView.nav.parentId : activeView?.id;

    syncActiveButtons(viewId);
    syncChildGroups();
  }

  function toggleActiveGoodsType(goodsTypeId) {
    expandedGoodsTypeId = expandedGoodsTypeId === goodsTypeId ? null : goodsTypeId;
    syncChildGroups();
  }

  function handleSelect(view) {
    if (view.nav?.kind === NAV_KINDS.goodsType && activeViewId === view.id) {
      toggleActiveGoodsType(view.id);
      return;
    }

    onSelect(view.id);
  }

  return {
    render,
    setActiveView
  };
}
