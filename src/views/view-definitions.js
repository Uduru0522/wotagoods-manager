import { NAV_GROUPS, NAV_KINDS, RENDERERS, VIEW_IDS } from "./view-metadata.js";

function createGoodsTypeViews(goodsTypes) {
  return goodsTypes.flatMap((goodsType) => [
    {
      id: `goods:${goodsType.id}`,
      label: goodsType.label,
      icon: "goodsType",
      section: "Goods type",
      title: goodsType.label,
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
      label: "Item details",
      icon: "items",
      section: goodsType.label,
      title: `${goodsType.label} item details`,
      renderer: RENDERERS.goodsTypeChild,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.goodsChild,
        parentId: `goods:${goodsType.id}`
      },
      goodsTypeId: goodsType.id,
      goodsType,
      action: "items",
      content: {
        heading: `Browse and edit ${goodsType.label.toLowerCase()}.`,
        description:
          `This child view is prepared for the ${goodsType.tableName} table's item listing, filters, and edit workflow.`
      }
    },
    {
      id: `goods:${goodsType.id}:add`,
      label: "Add item",
      icon: "add",
      section: goodsType.label,
      title: `Add ${goodsType.label} item`,
      renderer: RENDERERS.goodsTypeChild,
      nav: {
        group: NAV_GROUPS.primary,
        kind: NAV_KINDS.goodsChild,
        parentId: `goods:${goodsType.id}`
      },
      goodsTypeId: goodsType.id,
      goodsType,
      action: "add",
      content: {
        heading: `Register a new ${goodsType.label.toLowerCase()} item.`,
        description:
          `This child view is prepared for an add form backed by the ${goodsType.tableName} table.`
      }
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
        heading: "Goods types will be created here.",
        description:
          "This view is reserved for database setup. The next implementation step is adding a goods-type form that writes to the goods_types table and generates a dedicated item table for that type."
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
