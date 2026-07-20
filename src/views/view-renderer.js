import { createElement } from "../shared/dom.js";
import { RENDERERS } from "./view-metadata.js";
import { renderAdministrationView } from "./administration/administration-view.js";
import { renderItemsView } from "./items/items-view.js";
import {
  createMetaList,
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
  const heading = createElement("h3", { textContent: `${goodsType.displayName} overview` });

  article.append(
    heading,
    createMetaList([
      { label: "Goods type ID", value: goodsType.id },
      { label: "Description", value: goodsType.description || "No description" }
    ])
  );

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

export function createViewRenderer({
  createGoodsType,
  fieldManagement,
  goodsTypes,
  mutationController,
  onGoodsTypeCreated,
  onLocalDataReset,
  resetLocalData,
  themeController
}) {
  const renderers = {
    [RENDERERS.administration]: () => renderAdministrationView({
      createGoodsType,
      fieldManagement,
      goodsTypes,
      mutationController,
      onGoodsTypeCreated,
      onLocalDataReset,
      resetLocalData
    }),
    [RENDERERS.goodsType]: (view) => renderGoodsTypeView(view),
    [RENDERERS.goodsTypeItems]: (view) => renderItemsView(view),
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
