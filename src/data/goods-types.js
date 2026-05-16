export const GOODS_TYPE_TABLE_NAME = "goods_types";

export const GOODS_TYPE_COLUMNS = [
  { key: "id", label: "ID", type: "text" },
  { key: "label", label: "Display name", type: "text" },
  { key: "tableName", label: "Item table", type: "text" },
  { key: "description", label: "Description", type: "text" }
];

export function loadGoodsTypes() {
  return loadDatabaseGoodsTypes();
}

function loadDatabaseGoodsTypes() {
  return [];
}
