import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateContainedRectangle,
  calculateCropRectangle
} from "../../src/views/items/image-processor.js";

test("contained preview shows the complete source inside a fixed stage", () => {
  assert.deepEqual(calculateContainedRectangle(1600, 900, 520, 300), {
    x: 0,
    y: 3.75,
    width: 520,
    height: 292.5
  });

  assert.deepEqual(calculateContainedRectangle(900, 1600, 520, 300), {
    x: 175.625,
    y: 0,
    width: 168.75,
    height: 300
  });
});

test("contained preview rejects dimensions that cannot be rendered", () => {
  assert.equal(calculateContainedRectangle(0, 900, 520, 300), null);
});

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

test("crop scale reduces the selected source area without changing its ratio", () => {
  const full = calculateCropRectangle(1600, 900, 792, 560, 0.5, 0.5, 1);
  const detail = calculateCropRectangle(1600, 900, 792, 560, 0.5, 0.5, 0.5);

  assert.equal(detail.width, full.width / 2);
  assert.equal(detail.height, full.height / 2);
  assert.ok(detail.x > full.x);
  assert.ok(detail.y > full.y);
});
