import assert from "node:assert/strict";
import test from "node:test";

import {
  STORAGE_ERROR_CODES,
  StorageError,
  assertStorageAdapter
} from "../../src/data/contracts/storage-contract.js";
import { createDebugStorage } from "../../src/data/debug/debug-storage.js";
import { createGoodsTypeRecord } from "../../src/data/models/goods-type.js";

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
