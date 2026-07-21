import { createAssetRecord } from "../../data/models/asset.js";
import { createItemRecord } from "../../data/models/item.js";
import { normalizeItemValues } from "./item-values.js";

function defaultIdGenerator() {
  return globalThis.crypto.randomUUID();
}

export function createItemManagementOperations({
  storage,
  generateId = defaultIdGenerator,
  now = () => new Date().toISOString()
}) {
  const requiredMethods = [
    "createItem",
    "getAsset",
    "listFieldDefinitions",
    "listGoodsTypes",
    "listItems"
  ];

  if (requiredMethods.some((methodName) => typeof storage?.[methodName] !== "function")) {
    throw new TypeError("Item management requires readable and writable item storage.");
  }

  async function getEntryFields(goodsTypeId) {
    const goodsTypes = await storage.listGoodsTypes();

    if (!goodsTypes.some(({ id }) => id === goodsTypeId)) {
      throw new TypeError("The selected goods type is not active.");
    }

    return storage.listFieldDefinitions(goodsTypeId);
  }

  async function createItem({ goodsTypeId, name, customValues = {}, image = null }) {
    const fields = await getEntryFields(goodsTypeId);

    if (!image) {
      throw new TypeError("Image is required.");
    }

    const timestamp = now();
    const asset = createAssetRecord(
      {
        ...image,
        id: generateId()
      },
      { now: () => timestamp }
    );
    const item = createItemRecord(
      {
        id: generateId(),
        goodsTypeId,
        name,
        imageAssetId: asset.id,
        customValues: normalizeItemValues(fields, customValues)
      },
      { now: () => timestamp }
    );

    await storage.createItem({ asset, item });
    return structuredClone({ asset, item });
  }

  return {
    createItem,
    getAsset: (assetId) => storage.getAsset(assetId),
    getEntryFields,
    listItems: (goodsTypeId) => storage.listItems(goodsTypeId)
  };
}
