import { createElement } from "../shared/dom.js";
import { GOODS_TYPE_COLUMNS, GOODS_TYPE_TABLE_NAME } from "../data/goods-types.js";
import { RENDERERS } from "./view-metadata.js";
import {
  createActionHint,
  createMetaList,
  createSchemaTable,
  createSettingsSection,
  createSwitchSetting
} from "../shared/ui-components.js";

export function renderPlaceholderView(view) {
  const article = createElement("article", { className: "placeholder" });
  const heading = createElement("h3", { textContent: view.content.heading });
  const description = createElement("p", { textContent: view.content.description });

  article.append(heading, description);

  return article;
}

export function renderGoodsTypeView(view) {
  const { goodsType } = view;
  const article = createElement("article", { className: "content-panel goods-type-panel" });
  const heading = createElement("h3", { textContent: `${goodsType.label} database area` });
  const description = createElement("p", {
    textContent:
      "Selecting this goods type reveals the child views for item details and item registration. This metadata represents the table mapping the database layer will provide."
  });

  article.append(
    heading,
    description,
    createMetaList([
      { label: "Goods type ID", value: goodsType.id },
      { label: "Goods type table", value: GOODS_TYPE_TABLE_NAME },
      { label: "Generated item table", value: goodsType.tableName }
    ])
  );

  return article;
}

export function renderGoodsTypeChildView(view) {
  const article = createElement("article", { className: "content-panel" });
  const heading = createElement("h3", { textContent: view.content.heading });
  const description = createElement("p", { textContent: view.content.description });

  article.append(heading, description);

  return article;
}

export function renderAdministrationView(view, { goodsTypes }) {
  const article = createElement("article", { className: "settings-view administration-view" });
  const overview = renderPlaceholderView(view);
  const schemaSection = createSettingsSection({
    title: "Goods type registry",
    description:
      "Goods types are records in the goods_types table. Each goods type owns one generated item table."
  });

  if (goodsTypes.length > 0) {
    schemaSection.append(
      createSchemaTable({
        columns: GOODS_TYPE_COLUMNS,
        rows: goodsTypes
      })
    );
  } else {
    schemaSection.append(
      createElement("p", {
        className: "empty-note",
        textContent:
          "No goods types were loaded. This is expected until the database layer and goods-type creation form are implemented."
      })
    );
  }

  overview.append(
    createActionHint("Next action: implement the Administration form that creates goods types and generates item tables.")
  );
  article.append(overview, schemaSection);

  return article;
}

export function renderOptionsView({ themeController }) {
  const article = createElement("article", { className: "settings-view" });
  const colorTheme = createSettingsSection({
    title: "Color theme",
    description: "Adjust the application's appearance."
  });
  const darkMode = createSwitchSetting({
    checked: themeController.isDarkMode(),
    description: "Use a darker interface for lower-light environments.",
    id: "darkModeToggle",
    label: "Dark mode",
    onChange: (isEnabled) => themeController.setDarkMode(isEnabled)
  });

  colorTheme.append(darkMode);
  article.append(colorTheme);

  return article;
}

export function createViewRenderer({ goodsTypes, themeController }) {
  const renderers = {
    [RENDERERS.administration]: (view) => renderAdministrationView(view, { goodsTypes }),
    [RENDERERS.goodsType]: (view) => renderGoodsTypeView(view),
    [RENDERERS.goodsTypeChild]: (view) => renderGoodsTypeChildView(view),
    [RENDERERS.options]: () => renderOptionsView({ themeController }),
    [RENDERERS.placeholder]: (view) => renderPlaceholderView(view)
  };

  return {
    render(view) {
      const renderer = renderers[view.renderer] ?? renderers[RENDERERS.placeholder];
      return renderer(view);
    }
  };
}
