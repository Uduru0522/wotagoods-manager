import { createElement } from "./dom.js";

export function createActionButton(
  label,
  { className = "secondary-action", type = "button" } = {}
) {
  return createElement("button", {
    attributes: { type },
    className,
    textContent: label
  });
}
