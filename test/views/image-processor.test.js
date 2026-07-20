import assert from "node:assert/strict";
import test from "node:test";

import { calculateCropRectangle } from "../../src/views/items/image-processor.js";

test("crop calculation preserves the requested output ratio", () => {
  const crop = calculateCropRectangle(1600, 900, 560, 792, 0.5, 0.5);

  assert.ok(Math.abs(crop.width / crop.height - 560 / 792) < 0.000001);
  assert.ok(crop.x > 0);
  assert.equal(crop.y, 0);
});

test("crop position is clamped to source bounds", () => {
  const start = calculateCropRectangle(900, 1600, 792, 560, -1, -1);
  const end = calculateCropRectangle(900, 1600, 792, 560, 2, 2);

  assert.equal(start.x, 0);
  assert.equal(start.y, 0);
  assert.equal(end.x + end.width, 900);
  assert.equal(end.y + end.height, 1600);
});
