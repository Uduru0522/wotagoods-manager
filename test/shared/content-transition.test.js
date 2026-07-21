import assert from "node:assert/strict";
import test from "node:test";

import { createContentTransition } from "../../src/shared/content-transition.js";

function createFakeElement(initialHasChildren) {
  const classes = new Set();
  let hasChildren = initialHasChildren;

  return {
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name))
    },
    dataset: {},
    get offsetWidth() {
      return 0;
    },
    hasChildNodes: () => hasChildren,
    setHasChildren: (value) => {
      hasChildren = value;
    }
  };
}

function installMotionEnvironment({ duration = "1ms", reducedMotion = false } = {}) {
  const originals = {
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    getComputedStyle: globalThis.getComputedStyle,
    matchMedia: globalThis.matchMedia,
    requestAnimationFrame: globalThis.requestAnimationFrame
  };

  globalThis.getComputedStyle = () => ({ transitionDuration: duration });
  globalThis.matchMedia = () => ({ matches: reducedMotion });
  globalThis.requestAnimationFrame = (callback) => globalThis.setTimeout(callback, 0);
  globalThis.cancelAnimationFrame = (timer) => globalThis.clearTimeout(timer);

  return () => {
    Object.assign(globalThis, originals);
  };
}

function wait(milliseconds = 10) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

test("content transition replaces existing content between exit and entrance phases", async () => {
  const restoreEnvironment = installMotionEnvironment();
  const element = createFakeElement(true);
  const transition = createContentTransition(element);
  let state = "landing";

  try {
    transition.replace(() => {
      state = "editor";
    });

    assert.equal(state, "landing");
    assert.equal(element.dataset.contentTransition, "exit");

    await wait();
    await wait(0);

    assert.equal(state, "editor");
    assert.equal(element.dataset.contentTransition, undefined);
  } finally {
    restoreEnvironment();
  }
});

test("content transition can animate the first editor inserted into an empty slot", async () => {
  const restoreEnvironment = installMotionEnvironment();
  const element = createFakeElement(false);
  const transition = createContentTransition(element, { animateInitial: true });

  try {
    transition.replace(() => element.setHasChildren(true));

    assert.equal(element.dataset.contentTransition, "enter");

    await wait();
    await wait(0);

    assert.equal(element.dataset.contentTransition, undefined);
  } finally {
    restoreEnvironment();
  }
});

test("content transition applies reduced-motion replacements immediately", () => {
  const restoreEnvironment = installMotionEnvironment({ reducedMotion: true });
  const element = createFakeElement(true);
  const transition = createContentTransition(element);
  let wasUpdated = false;

  try {
    transition.replace(() => {
      wasUpdated = true;
    });

    assert.equal(wasUpdated, true);
    assert.equal(element.dataset.contentTransition, undefined);
  } finally {
    restoreEnvironment();
  }
});

test("content transition keeps only the newest pending replacement", async () => {
  const restoreEnvironment = installMotionEnvironment({ duration: "5ms" });
  const element = createFakeElement(true);
  const transition = createContentTransition(element);
  const appliedStates = [];

  try {
    transition.replace(() => appliedStates.push("loading"));
    transition.replace(() => appliedStates.push("workspace"));

    await wait(15);

    assert.deepEqual(appliedStates, ["workspace"]);
  } finally {
    restoreEnvironment();
  }
});

test("content transition cancellation prevents pending replacement work", async () => {
  const restoreEnvironment = installMotionEnvironment({ duration: "5ms" });
  const element = createFakeElement(true);
  const transition = createContentTransition(element);
  let wasUpdated = false;

  try {
    transition.replace(() => {
      wasUpdated = true;
    });
    transition.cancel();

    await wait(15);

    assert.equal(wasUpdated, false);
    assert.equal(element.dataset.contentTransition, undefined);
  } finally {
    restoreEnvironment();
  }
});
