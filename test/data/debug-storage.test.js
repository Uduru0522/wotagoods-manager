import assert from "node:assert/strict";
import test from "node:test";

import {
  STORAGE_ERROR_CODES,
  StorageError,
  assertStorageAdapter
} from "../../src/data/contracts/storage-contract.js";
import { createDebugStorage } from "../../src/data/debug/debug-storage.js";
import {
  createGoodsTypeRecord,
  parseGoodsTypeRecord
} from "../../src/data/models/goods-type.js";
import { createFieldDefinitionRecord } from "../../src/data/models/field-definition.js";

const FIXED_TIME = "2026-07-20T00:00:00.000Z";

test("createGoodsTypeRecord creates a complete active record", () => {
  const record = createGoodsTypeRecord(
    {
      id: "  figures  ",
      displayName: "  Figures  ",
      description: "Scale figures"
    },
    { now: () => FIXED_TIME }
  );

  assert.deepEqual(record, {
    id: "figures",
    displayName: "Figures",
    description: "Scale figures",
    isDeleted: false,
    deletedAt: null,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME
  });
});

test("createGoodsTypeRecord rejects missing stable identity", () => {
  assert.throws(
    () => createGoodsTypeRecord({ id: "", displayName: "Figures" }),
    /id must be a non-empty string/
  );
});

test("parseGoodsTypeRecord rejects inconsistent deletion state", () => {
  assert.throws(
    () =>
      parseGoodsTypeRecord({
        id: "figures",
        displayName: "Figures",
        description: "",
        isDeleted: false,
        deletedAt: FIXED_TIME,
        createdAt: FIXED_TIME,
        updatedAt: FIXED_TIME
      }),
    /deletedAt must be null/
  );
});

test("parseGoodsTypeRecord rejects malformed timestamps", () => {
  assert.throws(
    () =>
      parseGoodsTypeRecord({
        id: "figures",
        displayName: "Figures",
        description: "",
        isDeleted: false,
        deletedAt: null,
        createdAt: "not-a-date",
        updatedAt: FIXED_TIME
      }),
    /createdAt must be an ISO 8601 UTC timestamp/
  );
});

test("parseGoodsTypeRecord does not normalize persisted text", () => {
  assert.throws(
    () =>
      parseGoodsTypeRecord({
        id: " figures ",
        displayName: "Figures",
        description: "",
        isDeleted: false,
        deletedAt: null,
        createdAt: FIXED_TIME,
        updatedAt: FIXED_TIME
      }),
    /id cannot have leading or trailing whitespace/
  );
});

test("assertStorageAdapter reports missing capabilities", () => {
  assert.throws(
    () => assertStorageAdapter({ initialize() {} }),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.invalidAdapter
  );
});

test("DebugStorage requires initialization and returns isolated copies", async () => {
  const storage = assertStorageAdapter(createDebugStorage());

  await assert.rejects(
    storage.listGoodsTypes(),
    (error) =>
      error instanceof StorageError && error.code === STORAGE_ERROR_CODES.notInitialized
  );

  await storage.initialize();

  const firstRead = await storage.listGoodsTypes();
  firstRead[0].displayName = "Changed outside storage";

  const secondRead = await storage.listGoodsTypes();

  assert.equal(secondRead.length, 3);
  assert.equal(secondRead[0].displayName, "Tapestries");

  storage.close();
  await assert.rejects(storage.listGoodsTypes(), StorageError);
});

test("DebugStorage hides soft-deleted goods types by default", async () => {
  const storage = createDebugStorage({
    goodsTypes: [
      createGoodsTypeRecord({ id: "active", displayName: "Active" }),
      createGoodsTypeRecord({
        id: "deleted",
        displayName: "Deleted",
        isDeleted: true
      })
    ]
  });

  await storage.initialize();

  assert.deepEqual(
    (await storage.listGoodsTypes()).map(({ id }) => id),
    ["active"]
  );
  assert.equal((await storage.listGoodsTypes({ includeDeleted: true })).length, 2);
});

test("DebugStorage creates goods types in memory without partial invalid writes", async () => {
  const storage = createDebugStorage({ goodsTypes: [] });
  const goodsType = createGoodsTypeRecord(
    { id: "figures", displayName: "Figures" },
    { now: () => FIXED_TIME }
  );
  const field = {
    id: "figures-name",
    goodsTypeId: "figures",
    key: "name",
    displayName: "Name",
    dataType: "text",
    isRequired: true,
    isBuiltIn: true,
    position: 0,
    defaultValue: null,
    options: null,
    isDeleted: false,
    deletedAt: null,
    createdAt: FIXED_TIME,
    updatedAt: FIXED_TIME
  };

  await storage.initialize();
  await storage.createGoodsType({ goodsType, fieldDefinitions: [field] });

  assert.deepEqual((await storage.listGoodsTypes()).map(({ id }) => id), ["figures"]);
  await assert.rejects(
    storage.createGoodsType({
      goodsType: { ...goodsType, id: "posters", displayName: "Posters" },
      fieldDefinitions: [{ ...field, id: "posters-name", goodsTypeId: "wrong" }]
    }),
    (error) => error.code === STORAGE_ERROR_CODES.invalidData
  );
  assert.deepEqual((await storage.listGoodsTypes()).map(({ id }) => id), ["figures"]);

  await assert.rejects(
    storage.createGoodsType({ goodsType: { id: "invalid" }, fieldDefinitions: [] }),
    (error) => error instanceof StorageError && error.code === STORAGE_ERROR_CODES.invalidData
  );
});

test("DebugStorage lists fixture fields and applies isolated field changes", async () => {
  const storage = createDebugStorage();

  await storage.initialize();
  const fixtureFields = await storage.listFieldDefinitions("figures");

  assert.deepEqual(fixtureFields.map(({ key }) => key), ["id", "name", "image"]);

  const customField = createFieldDefinitionRecord(
    {
      id: "figures-scale",
      goodsTypeId: "figures",
      key: "scale",
      displayName: "Scale",
      dataType: "text",
      position: 3
    },
    { now: () => FIXED_TIME }
  );
  await storage.saveFieldDefinitions({
    goodsTypeId: "figures",
    fieldDefinitions: [customField]
  });

  const firstRead = await storage.listFieldDefinitions("figures");
  firstRead.at(-1).displayName = "External change";
  assert.equal((await storage.listFieldDefinitions("figures")).at(-1).displayName, "Scale");

  await assert.rejects(
    storage.saveFieldDefinitions({
      goodsTypeId: "figures",
      fieldDefinitions: [{ ...customField, id: "duplicate", key: "name" }]
    }),
    (error) => error.code === STORAGE_ERROR_CODES.operationFailed
  );
  assert.equal((await storage.listFieldDefinitions("figures")).length, 4);
});

test("DebugStorage reset clears all temporary domain records", async () => {
  const storage = createDebugStorage();

  await storage.initialize();
  assert.equal((await storage.listGoodsTypes()).length, 3);
  assert.equal((await storage.listFieldDefinitions("figures")).length, 3);

  await storage.resetData();

  assert.deepEqual(await storage.listGoodsTypes(), []);
  assert.deepEqual(await storage.listFieldDefinitions("figures"), []);
});
