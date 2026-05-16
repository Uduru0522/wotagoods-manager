import { APP_CONFIG } from "./config.js";

function queryRequiredElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element;
}

export function getAppElements() {
  const { selectors } = APP_CONFIG;

  return {
    primaryNavList: queryRequiredElement(selectors.primaryNavList),
    utilityNavList: queryRequiredElement(selectors.utilityNavList),
    viewPanel: queryRequiredElement(selectors.viewPanel),
    viewSection: queryRequiredElement(selectors.viewSection),
    viewTitle: queryRequiredElement(selectors.viewTitle)
  };
}
