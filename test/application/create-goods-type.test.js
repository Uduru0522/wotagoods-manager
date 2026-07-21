import assert from "node:assert/strict";
import test from "node:test";

import {
  createGoodsTypeCreationOperation
} from "../../src/application/goods-types/create-goods-type.js";
import { BUILT_IN_ITEM_FIELDS } from "../../src/data/models/built-in-fields.js";
import {
  createFieldDefinitionRecord,
  parseFieldDefinitionRecord
} from "../../src/data/models/field-definition.js";

const FIXED_TIME = "2026-07-20T00:00:00.000Z";

test("field definition records normalize creation input and validate persisted data", () => {
  const record = createFieldDefinitionRecord(
    {
      id: " field-id ",
      goodsTypeId: " goods-type-id ",
      key: " item_code ",
      displayName: " Item code ",
      dataType: "text",
      position: 3
    },
    { now: () => FIXED_TIME }
  );

  assert.equal(record.key, "item_code");
  assert.equal(record.displayName, "Item code");
  assert.equal(record.isBuiltIn, false);
  assert.equal(record.createdAt, FIXED_TIME);
  assert.equal(
    createFieldDefinitionRecord({
      ...record,
      id: "field-with-default",
      defaultValue: ["first", 2, true]
    }).defaultValue[1],
    2
  );
  assert.throws(
    () => parseFieldDefinitionRecord({ ...record, key: "Item Code" }),
    /lowercase snake_case/
  );
});

test("field definition records validate selection option identity", () => {
  const selection = createFieldDefinitionRecord(
    {
      id: "status",
      goodsTypeId: "figures",
      key: "status",
      displayName: "Status",
      dataType: "select",
      position: 3,
      options: {
        choices: [
          { id: "owned", label: "Owned" },
          { id: "ordered", label: "Ordered" }
        ]
      }
    },
    { now: () => FIXED_TIME }
  );

  assert.equal(selection.options.choices.length, 2);
  assert.throws(
    () =>
      createFieldDefinitionRecord({
        ...selection,
        id: "invalid-status",
        options: {
          choices: [
            { id: "duplicate", label: "Owned" },
            { id: "duplicate", label: "Owned" }
          ]
        }
      }),
    /must be unique/
  );
  assert.throws(
    () => createFieldDefinitionRecord({ ...selection, id: "missing-options", options: null }),
    /require at least one option/
  );
});

test("boolean fields normalize legacy and configurable option labels", () => {
  const legacy = createFieldDefinitionRecord(
    {
      id: "censored",
      goodsTypeId: "figures",
      key: "censored",
      displayName: "Censorship",
      dataType: "boolean",
      position: 3
    },
    { now: () => FIXED_TIME }
  );
  const configured = createFieldDefinitionRecord({
    ...legacy,
    id: "custom-censored",
    options: { falseLabel: "Uncensored", trueLabel: "Censored" }
  });

  assert.deepEqual(legacy.options, { falseLabel: "No", trueLabel: "Yes" });
  assert.deepEqual(configured.options, {
    falseLabel: "Uncensored",
    trueLabel: "Censored"
  });
  assert.throws(
    () => createFieldDefinitionRecord({
      ...legacy,
      id: "invalid-toggle",
      options: { falseLabel: "", trueLabel: "On" }
    }),
    /non-empty/
  );
  assert.throws(
    () => createFieldDefinitionRecord({
      ...legacy,
      id: "duplicate-toggle",
      options: { falseLabel: "Same label", trueLabel: "same  label" }
    }),
    /must be different/
  );
});

test("goods-type creation builds the type and protected fields as one storage request", async () => {
  const writes = [];
  const generatedIds = ["goods-id", "field-id", "field-name", "field-image"];
  const createGoodsType = createGoodsTypeCreationOperation({
    storage: {
      async createGoodsType(bundle) {
        writes.push(bundle);
      }
    },
    generateId: () => generatedIds.shift(),
    now: () => FIXED_TIME
  });

  const result = await createGoodsType({
    displayName: "  Figures  ",
    description: "  Scale and prize figures.  "
  });

  assert.equal(writes.length, 1);
  assert.deepEqual(result.goodsType, {
    id: "goods-id",
    displayName: "Figures",
    description: "Scale and prize figures.",
    isDeleted: false,
    deletedAt: null,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME
  });
  assert.deepEqual(
    result.fieldDefinitions.map(({ key, isBuiltIn, goodsTypeId }) => ({
      key,
      isBuiltIn,
      goodsTypeId
    })),
    BUILT_IN_ITEM_FIELDS.map(({ key }) => ({
      key,
      isBuiltIn: true,
      goodsTypeId: "goods-id"
    }))
  );
  assert.ok(
    result.fieldDefinitions.every(
      ({ createdAt, updatedAt }) => createdAt === FIXED_TIME && updatedAt === FIXED_TIME
    )
  );
  assert.equal(
    result.fieldDefinitions.find(({ key }) => key === "image").isRequired,
    true
  );
});

test("goods-type creation validates before writing", async () => {
  let writeCount = 0;
  const createGoodsType = createGoodsTypeCreationOperation({
    storage: {
      async createGoodsType() {
        writeCount += 1;
      }
    },
    generateId: () => "generated-id"
  });

  await assert.rejects(createGoodsType({ displayName: "   " }), /displayName/);
  assert.equal(writeCount, 0);
});
