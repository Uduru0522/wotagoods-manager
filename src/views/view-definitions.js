import { NAV_GROUPS, NAV_KINDS, RENDERERS, VIEW_IDS } from "./view-metadata.js";

function createGoodsTypeViews(goodsTypes) {
  return goodsTypes.flatMap((goodsType) => [
    {
      id: `goods:${goodsType.id}`,
      label: goodsType.displayName,
      icon: "goodsType",
      section: "Goods type",
      title: goodsType.displayName,
      renderer: RENDERERS.goodsType,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.goodsType
      },
      goodsTypeId: goodsType.id,
      goodsType
    },
    {
      id: `goods:${goodsType.id}:items`,
      label: "Items",
      icon: "items",
      section: goodsType.displayName,
      title: `${goodsType.displayName} items`,
      renderer: RENDERERS.goodsTypeItems,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.goodsChild,
        parentId: `goods:${goodsType.id}`
      },
      goodsTypeId: goodsType.id,
      goodsType
    }
  ]);
}

export function createViewDefinitions(goodsTypes) {
  return [
    {
      id: VIEW_IDS.dashboard,
      label: "Dashboard",
      icon: "dashboard",
      section: "Overview",
      title: "Dashboard",
      renderer: RENDERERS.placeholder,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.view
      },
      content: {
        heading: "Start by creating a goods type.",
        description:
          "User mode will show collection summaries after goods types exist. Go to Administration to define your first type, or open Debug mode to preview the planned goods-type navigation with temporary sample data."
      }
    },
    ...createGoodsTypeViews(goodsTypes),
    {
      id: VIEW_IDS.administration,
      label: "Administration",
      icon: "administration",
      section: "Database setup",
      title: "Administration",
      renderer: RENDERERS.administration,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.view
      },
      content: {
        heading: "Create and manage goods types.",
        description:
          "Create collections here. Custom-field management will build on the same local database model."
      }
    },
    {
      id: VIEW_IDS.options,
      label: "Options",
      icon: "options",
      section: "Application",
      title: "Options",
      renderer: RENDERERS.options,
      nav: {
        group: NAV_GROUPS.utility,
        kind: NAV_KINDS.view
      }
    }
  ];
}

export function getViewById(views, viewId) {
  return views.find((view) => view.id === viewId) ?? views[0];
}
