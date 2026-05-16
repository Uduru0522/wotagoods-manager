export function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);
  const { attributes = {}, className, dataset = {}, textContent } = options;

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  Object.entries(dataset).forEach(([name, value]) => {
    element.dataset[name] = value;
  });

  return element;
}

export function clearElement(element) {
  element.replaceChildren();
}
