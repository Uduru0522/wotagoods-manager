import { createElement } from "./dom.js";

function createSettingsSection({ description, title }) {
  const details = createElement("details", {
    attributes: { open: "" },
    className: "settings-section"
  });
  const summary = createElement("summary", { className: "settings-section-header" });
  const copy = createElement("div");
  const heading = createElement("h3", { textContent: title });
  const paragraph = createElement("p", { textContent: description });

  copy.append(heading, paragraph);
  summary.append(copy);
  details.append(summary);

  return details;
}

function createSwitchSetting({ checked, description, id, label, onChange }) {
  const row = createElement("label", {
    attributes: { for: id },
    className: "setting-row"
  });
  const copy = createElement("span");
  const title = createElement("strong", { textContent: label });
  const helper = createElement("small", { textContent: description });
  const input = createElement("input", {
    attributes: {
      id,
      type: "checkbox"
    },
    className: "switch-input"
  });

  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));

  copy.append(title, helper);
  row.append(copy, input);

  return row;
}

export function renderPlaceholderView(view) {
  const article = createElement("article", { className: "placeholder" });
  const heading = createElement("h3", { textContent: view.content.heading });
  const description = createElement("p", { textContent: view.content.description });

  article.append(heading, description);

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

export function createViewRenderer({ themeController }) {
  const renderers = {
    options: () => renderOptionsView({ themeController }),
    placeholder: (view) => renderPlaceholderView(view)
  };

  return {
    render(view) {
      const renderer = renderers[view.renderer] ?? renderers.placeholder;
      return renderer(view);
    }
  };
}
