import { createElement } from "../../shared/dom.js";
import { createSchemaTable, createSettingsSection } from "../../shared/ui-components.js";
import { createGoodsTypeCreator } from "./goods-type-creator.js";

const GOODS_TYPE_COLUMNS = Object.freeze([
  { key: "id", label: "ID" },
  { key: "displayName", label: "Display name" },
  { key: "description", label: "Description" }
]);

export function renderAdministrationView({
  createGoodsType,
  goodsTypes,
  mutationController,
  onGoodsTypeCreated
}) {
  const article = createElement("article", {
    className: "settings-view administration-view"
  });
  const schemaSection = createSettingsSection({
    title: "Goods type registry",
    description:
      "Goods types organize items and define the custom fields shown in forms and detail views."
  });

  if (goodsTypes.length > 0) {
    schemaSection.append(
      createSchemaTable({ columns: GOODS_TYPE_COLUMNS, rows: goodsTypes })
    );
  } else {
    schemaSection.append(
      createElement("p", {
        className: "empty-note",
        textContent:
          "No goods types are saved yet. Create the first collection above."
      })
    );
  }

  article.append(
    createGoodsTypeCreator({
      createGoodsType,
      goodsTypes,
      mutationController,
      onCreated: onGoodsTypeCreated
    }),
    schemaSection
  );

  return article;
}
