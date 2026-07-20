import assert from "node:assert/strict";
import test from "node:test";

import {
  getAnimationDurationMs,
  getCustomPropertyDurationMs,
  getLongestCssTime,
  getTransitionDurationMs,
  parseCssTime,
  prefersReducedMotion
} from "../../src/shared/motion.js";

test("CSS time parsing accepts milliseconds and seconds", () => {
  assert.equal(parseCssTime("160ms"), 160);
  assert.equal(parseCssTime("0.18s"), 180);
  assert.equal(parseCssTime("invalid"), 0);
  assert.equal(parseCssTime("invalidms"), 0);
  assert.equal(parseCssTime("-1s"), 0);
});

test("reduced-motion preference is read defensively", () => {
  const originalMatchMedia = globalThis.matchMedia;

  try {
    delete globalThis.matchMedia;
    assert.equal(prefersReducedMotion(), false);

    globalThis.matchMedia = () => ({ matches: true });
    assert.equal(prefersReducedMotion(), true);
  } finally {
    globalThis.matchMedia = originalMatchMedia;
  }
});

test("the longest CSS time handles comma-separated duration lists", () => {
  assert.equal(getLongestCssTime("80ms, 0.16s"), 160);
  assert.equal(getLongestCssTime("0s", 90), 90);
});

test("computed duration helpers read their respective style properties", () => {
  const originalGetComputedStyle = globalThis.getComputedStyle;

  globalThis.getComputedStyle = () => ({
    animationDuration: "120ms",
    getPropertyValue: (propertyName) => propertyName === "--motion-fast" ? "0.14s" : "",
    transitionDuration: "80ms, 0.1s"
  });

  try {
    assert.equal(getAnimationDurationMs({}, 20), 120);
    assert.equal(getCustomPropertyDurationMs({}, "--motion-fast", 20), 140);
    assert.equal(getTransitionDurationMs({}, 20), 100);
  } finally {
    globalThis.getComputedStyle = originalGetComputedStyle;
  }
});
