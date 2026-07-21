import assert from "node:assert/strict";
import test from "node:test";

import { getItemDisplayData } from "../../src/views/items/item-display-model.js";
import {
  formatMissingFieldCount,
  formatMissingFields
} from "../../src/views/items/item-missing-warning.js";

const FIELDS = [
  { displayName: "Foo" },
  { displayName: "Bar" },
  { displayName: "Foobar" },
  { displayName: "Release date" }
];

test("missing-field summaries expose all names or an exact hidden count", () => {
  assert.equal(
    formatMissingFields(FIELDS),
    "Missing value at field(s): Foo, Bar, Foobar, Release date."
  );
  assert.equal(
    formatMissingFields(FIELDS, 2),
    "Missing value at field(s): Foo, Bar +2 more."
  );
  assert.equal(formatMissingFieldCount(FIELDS), "4 Missing field(s)");
});

test("item display data includes every field and identifies missing requirements", () => {
  const fields = [
    { id: "name", isBuiltIn: true, isRequired: true },
    { id: "maker", isBuiltIn: false, isRequired: true },
    { id: "scale", isBuiltIn: false, isRequired: false }
  ];
  const item = { customValues: { scale: "1/7" } };

  assert.deepEqual(getItemDisplayData(item, fields), {
    fieldValues: [
      { field: fields[1], value: undefined },
      { field: fields[2], value: "1/7" }
    ],
    missingRequiredFields: [fields[1]],
  });
});

test("item display data preserves falsy values and includes unset optional fields", () => {
  const fields = [
    { id: "count", isBuiltIn: false, isRequired: false },
    { id: "owned", isBuiltIn: false, isRequired: false },
    { id: "notes", isBuiltIn: false, isRequired: false }
  ];

  assert.deepEqual(getItemDisplayData({
    customValues: { count: 0, owned: false }
  }, fields), {
    fieldValues: [
      { field: fields[0], value: 0 },
      { field: fields[1], value: false },
      { field: fields[2], value: undefined }
    ],
    missingRequiredFields: []
  });
});
