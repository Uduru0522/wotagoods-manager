import { createBuiltInFieldDefinitions } from "../models/built-in-fields.js";
import { createGoodsTypeRecord } from "../models/goods-type.js";

const FIXTURE_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const GOODS_TYPE_FIXTURES = Object.freeze([
  {
    id: "tapestries",
    displayName: "Tapestries",
    description: "Wall scrolls, fabric posters, and related display goods."
  },
  {
    id: "figures",
    displayName: "Figures",
    description: "Scale figures, prize figures, and boxed display items."
  },
  {
    id: "acrylic-goods",
    displayName: "Acrylic goods",
    description: "Acrylic stands, keychains, panels, and similar goods."
  }
]);

export function createDebugGoodsTypes() {
  return GOODS_TYPE_FIXTURES.map((record) =>
    createGoodsTypeRecord(record, { now: () => FIXTURE_TIMESTAMP })
  );
}

export function createDebugFieldDefinitions(goodsTypes = createDebugGoodsTypes()) {
  return goodsTypes.flatMap((goodsType) =>
    createBuiltInFieldDefinitions({
      goodsTypeId: goodsType.id,
      generateId: (key) => `${goodsType.id}-${key}`,
      now: () => FIXTURE_TIMESTAMP
    })
  );
}
