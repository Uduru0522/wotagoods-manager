export const GOODS_TYPE_TABLE_NAME = "goods_types";

export const GOODS_TYPE_COLUMNS = [
  { key: "id", label: "ID", type: "text" },
  { key: "label", label: "Display name", type: "text" },
  { key: "tableName", label: "Item table", type: "text" },
  { key: "description", label: "Description", type: "text" }
];

export const DEBUG_GOODS_TYPES = [
  {
    id: "tapestries",
    label: "Tapestries",
    tableName: "goods_tapestries",
    description: "Wall scrolls, fabric posters, and related display goods."
  },
  {
    id: "figures",
    label: "Figures",
    tableName: "goods_figures",
    description: "Scale figures, prize figures, and boxed display items."
  },
  {
    id: "acrylic-goods",
    label: "Acrylic goods",
    tableName: "goods_acrylic_goods",
    description: "Acrylic stands, keychains, panels, and similar goods."
  }
];

export function loadGoodsTypes({ isDebugMode }) {
  if (isDebugMode) {
    return [...DEBUG_GOODS_TYPES];
  }

  return loadDatabaseGoodsTypes();
}

function loadDatabaseGoodsTypes() {
  return [];
}
