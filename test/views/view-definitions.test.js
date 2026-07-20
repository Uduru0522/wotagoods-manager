import assert from "node:assert/strict";
import test from "node:test";

import { createViewDefinitions } from "../../src/views/view-definitions.js";
import { NAV_KINDS, RENDERERS } from "../../src/views/view-metadata.js";

const GOODS_TYPE = {
  id: "figures",
  displayName: "Figures",
  description: "Scale figures"
};

test("goods types expose one overview and one Items view", () => {
  const views = createViewDefinitions([GOODS_TYPE]);
  const goodsViews = views.filter((view) => view.goodsTypeId === GOODS_TYPE.id);
  const overview = goodsViews.find((view) => view.id === "goods:figures");
  const items = goodsViews.find((view) => view.id === "goods:figures:items");

  assert.equal(goodsViews.length, 2);
  assert.equal(overview.renderer, RENDERERS.goodsType);
  assert.equal(items.label, "Items");
  assert.equal(items.renderer, RENDERERS.goodsTypeItems);
  assert.equal(items.nav.kind, NAV_KINDS.goodsChild);
  assert.equal(items.nav.parentId, overview.id);
  assert.equal(views.some((view) => view.id === "goods:figures:add"), false);
});
