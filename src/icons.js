const ICON_PATHS = {
  dashboard: [
    "M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z"
  ],
  items: [
    "M5 4h14v16H5V4Z",
    "M8 8h8",
    "M8 12h8",
    "M8 16h5"
  ],
  add: [
    "M12 5v14",
    "M5 12h14"
  ],
  administration: [
    "M12 4l7 4v8l-7 4-7-4V8l7-4Z",
    "M12 8v8",
    "M8 10l8 4"
  ],
  options: [
    "M4 7h10",
    "M18 7h2",
    "M16 5v4",
    "M4 17h2",
    "M10 17h10",
    "M8 15v4"
  ]
};

export function createIcon(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.classList.add("nav-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("viewBox", "0 0 24 24");

  ICON_PATHS[iconName].forEach((pathData) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    svg.append(path);
  });

  return svg;
}
