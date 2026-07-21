import assert from "node:assert/strict";
import test from "node:test";

import { describeItemSaveError } from "../../src/views/items/item-save-error.js";

test("item save errors expose the deepest actionable cause", () => {
  const validationError = new TypeError("Release must be a valid date.");
  const storageError = new Error("The item could not be saved.", {
    cause: validationError
  });

  assert.equal(describeItemSaveError(storageError), validationError.message);
});

test("item save errors explain exhausted browser storage", () => {
  const quotaError = new Error("Quota reached");
  quotaError.name = "QuotaExceededError";

  assert.equal(
    describeItemSaveError(new Error("Save failed", { cause: quotaError })),
    "The item could not be saved because browser storage is full."
  );
});
