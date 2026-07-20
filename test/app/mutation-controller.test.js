import assert from "node:assert/strict";
import test from "node:test";

import { createMutationController } from "../../src/app/mutation-controller.js";

function createRoot() {
  const attributes = new Map();

  return {
    attributes,
    removeAttribute(name) {
      attributes.delete(name);
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    toggleAttribute(name, force) {
      if (force) {
        attributes.set(name, "");
      } else {
        attributes.delete(name);
      }
    }
  };
}

test("mutation controller exposes and always clears the global busy state", async () => {
  const root = createRoot();
  const controller = createMutationController(root);

  await assert.rejects(
    controller.run(async () => {
      assert.equal(controller.isActive, true);
      assert.equal(root.attributes.get("aria-busy"), "true");
      assert.equal(root.attributes.has("data-mutating"), true);
      throw new Error("write failed");
    }),
    /write failed/
  );

  assert.equal(controller.isActive, false);
  assert.equal(root.attributes.size, 0);
});

test("mutation controller prevents overlapping writes", async () => {
  const root = createRoot();
  const controller = createMutationController(root);
  let finish;
  const activeWrite = controller.run(
    () => new Promise((resolve) => {
      finish = resolve;
    })
  );

  await assert.rejects(
    controller.run(async () => {}),
    /already in progress/
  );
  finish();
  await activeWrite;
});
