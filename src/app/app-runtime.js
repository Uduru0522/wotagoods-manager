import { APP_CONFIG } from "./config.js";
import { createViewRouter } from "./view-router.js";
import { createNavigation } from "../navigation/navigation.js";
import { createViewDefinitions } from "../views/view-definitions.js";
import { createViewRenderer } from "../views/view-renderer.js";

export function mountAppRuntime({ elements, goodsTypes, themeController }) {
  const views = createViewDefinitions(goodsTypes);
  const renderer = createViewRenderer({ goodsTypes, themeController });
  let router;

  const navigation = createNavigation({
    primaryContainer: elements.primaryNavList,
    utilityContainer: elements.utilityNavList,
    views,
    onSelect: (viewId) => router.setActiveView(viewId)
  });

  router = createViewRouter({
    navigation,
    renderer,
    views,
    viewPanel: elements.viewPanel,
    viewSection: elements.viewSection,
    viewTitle: elements.viewTitle
  });

  navigation.render();
  router.setActiveView(APP_CONFIG.defaultViewId);
}
