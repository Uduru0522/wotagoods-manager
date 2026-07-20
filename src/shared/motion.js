export const MAX_UI_MOTION_MS = 200;

export function parseCssTime(value) {
  const normalizedValue = value.trim();
  let durationMs = 0;

  if (normalizedValue.endsWith("ms")) {
    durationMs = Number.parseFloat(normalizedValue);
  } else if (normalizedValue.endsWith("s")) {
    durationMs = Number.parseFloat(normalizedValue) * 1000;
  }

  return Number.isFinite(durationMs) && durationMs > 0 ? durationMs : 0;
}

export function getLongestCssTime(value, fallbackMs = 0) {
  const longestDuration = Math.max(...value.split(",").map(parseCssTime));

  return longestDuration > 0 ? longestDuration : fallbackMs;
}

export function getAnimationDurationMs(element, fallbackMs = 0) {
  return getLongestCssTime(getComputedStyle(element).animationDuration, fallbackMs);
}

export function getCustomPropertyDurationMs(element, propertyName, fallbackMs = 0) {
  const value = getComputedStyle(element).getPropertyValue(propertyName);

  return parseCssTime(value) || fallbackMs;
}

export function getTransitionDurationMs(element, fallbackMs = 0) {
  return getLongestCssTime(getComputedStyle(element).transitionDuration, fallbackMs);
}

export function prefersReducedMotion() {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
