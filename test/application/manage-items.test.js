import assert from "node:assert/strict";
import test from "node:test";

import {
  createItemManagementOperations,
  normalizeItemValues
} from "../../src/application/items/manage-items.js";
import { createFieldDefinitionRecord } from "../../src/data/models/field-definition.js";
import { createItemRecord, parseItemRecord } from "../../src/data/models/item.js";

const FIXED_TIME = "2026-07-20T00:00:00.000Z";

function createField(input) {
  return createFieldDefinitionRecord(
    {
      goodsTypeId: "figures",
      position: 3,
      ...input
    },
    { now: () => FIXED_TIME }
  );
}

test("item records normalize creation input and reject invalid persisted values", () => {
  const item = createItemRecord(
    {
      id: " item-1 ",
      goodsTypeId: " figures ",
      name: " First figure ",
      customValues: { scale: "1/7" }
    },
    { now: () => FIXED_TIME }
  );

  assert.equal(item.name, "First figure");
  assert.equal(item.imageAssetId, null);
  assert.deepEqual(item.customValues, { scale: "1/7" });
  assert.throws(() => parseItemRecord({ ...item, customValues: { bad: Infinity } }), /JSON/);
});

test("item values validate supported field types and stable selection IDs", () => {
  const fields = [
    createField({ id: "release", key: "release", displayName: "Release", dataType: "date" }),
    createField({ id: "price", key: "price", displayName: "Price", dataType: "number" }),
    createField({
      id: "status",
      key: "status",
      displayName: "Status",
      dataType: "select",
      options: { choices: [{ id: "owned", label: "Owned" }] }
    })
  ];

  assert.deepEqual(
    normalizeItemValues(fields, {
      release: "2026-07-20",
      price: 1200,
      status: "owned"
    }),
    { release: "2026-07-20", price: 1200, status: "owned" }
  );
  assert.throws(
    () => normalizeItemValues(fields, { release: "2026-02-30" }),
    /valid date/
  );
  assert.throws(
    () => normalizeItemValues(fields, { status: "unknown" }),
    /invalid selection/
  );
  assert.throws(() => normalizeItemValues(fields, { removed: "value" }), /Unknown/);
});

test("required text is checked after whitespace normalization", () => {
  const field = createField({
    id: "maker",
    key: "maker",
    displayName: "Maker",
    dataType: "text",
    isRequired: true
  });

  assert.throws(() => normalizeItemValues([field], { maker: "   " }), /Maker is required/);
});

test("item creation reloads active fields and writes one validated record", async () => {
  const writes = [];
  const nameField = createField({
    id: "field-name",
    key: "name",
    displayName: "Name",
    dataType: "text",
    isBuiltIn: true,
    isRequired: true,
    position: 1
  });
  const notesField = createField({
    id: "notes",
    key: "notes",
    displayName: "Notes",
    dataType: "long_text"
  });
  const operations = createItemManagementOperations({
    storage: {
      async createItem(item) { writes.push(item); },
      async listFieldDefinitions() { return [nameField, notesField]; },
      async listGoodsTypes() { return [{ id: "figures" }]; },
      async listItems() { return []; }
    },
    generateId: () => "item-1",
    now: () => FIXED_TIME
  });

  const item = await operations.createItem({
    goodsTypeId: "figures",
    name: " Example ",
    customValues: { notes: "Boxed" }
  });

  assert.equal(writes.length, 1);
  assert.deepEqual(item, writes[0]);
  assert.equal(item.name, "Example");
  assert.deepEqual(item.customValues, { notes: "Boxed" });
});
