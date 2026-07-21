import { createAssetRecord } from "../models/asset.js";
import { createBuiltInFieldDefinitions } from "../models/built-in-fields.js";
import { createFieldDefinitionRecord } from "../models/field-definition.js";
import { createGoodsTypeRecord } from "../models/goods-type.js";
import { createItemRecord } from "../models/item.js";

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

const CUSTOM_FIELD_FIXTURES = Object.freeze({
  tapestries: Object.freeze([
    { key: "series", displayName: "Series", dataType: "text", isRequired: true },
    { key: "notes", displayName: "Notes", dataType: "long_text" },
    { key: "width_cm", displayName: "Width (cm)", dataType: "number" },
    { key: "release_date", displayName: "Release date", dataType: "date" },
    {
      key: "display_status",
      displayName: "Display status",
      dataType: "boolean",
      isRequired: true,
      options: { falseLabel: "Stored", trueLabel: "Displayed" }
    },
    { key: "source", displayName: "Reference page", dataType: "url" },
    {
      key: "condition",
      displayName: "Condition",
      dataType: "select",
      options: {
        choices: [
          { id: "sealed", label: "Sealed" },
          { id: "opened", label: "Opened" },
          { id: "displayed", label: "Displayed" }
        ]
      }
    }
  ]),
  figures: Object.freeze([
    { key: "manufacturer", displayName: "Manufacturer", dataType: "text" },
    {
      key: "scale",
      displayName: "Scale",
      dataType: "select",
      options: {
        choices: [
          { id: "one_seventh", label: "1/7" },
          { id: "one_eighth", label: "1/8" },
          { id: "non_scale", label: "Non-scale" }
        ]
      }
    },
    {
      key: "edition",
      displayName: "Edition",
      dataType: "boolean",
      isRequired: true,
      options: { falseLabel: "Standard", trueLabel: "Limited" }
    }
  ]),
  "acrylic-goods": Object.freeze([
    {
      key: "format",
      displayName: "Format",
      dataType: "select",
      options: {
        choices: [
          { id: "stand", label: "Stand" },
          { id: "keychain", label: "Keychain" },
          { id: "panel", label: "Panel" }
        ]
      }
    },
    { key: "event", displayName: "Event", dataType: "text" }
  ])
});

const ITEM_FIXTURES = Object.freeze([
  {
    id: "tapestry-summer-festival",
    goodsTypeId: "tapestries",
    name: "Summer Festival B2 Tapestry",
    imageAssetId: "asset-tapestry-summer-festival",
    customValues: {
      "tapestries-series": "Starlight Memories",
      "tapestries-notes": "Convention edition with the original storage sleeve.",
      "tapestries-width_cm": 51.5,
      "tapestries-release_date": "2025-08-16",
      "tapestries-display_status": true,
      "tapestries-source": "https://example.com/catalog/summer-festival",
      "tapestries-condition": "displayed"
    },
    createdAt: "2026-01-03T09:00:00.000Z",
    updatedAt: "2026-01-12T12:00:00.000Z"
  },
  {
    id: "tapestry-winter-cafe",
    goodsTypeId: "tapestries",
    name: "Winter Cafe Wall Scroll",
    imageAssetId: "asset-tapestry-winter-cafe",
    customValues: {
      "tapestries-series": "Cafe Collection",
      "tapestries-display_status": false
    },
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: "2026-01-11T12:00:00.000Z"
  },
  {
    id: "tapestry-legacy-record",
    goodsTypeId: "tapestries",
    name: "Legacy Imported Tapestry",
    imageAssetId: "asset-tapestry-legacy-record",
    customValues: {
      "tapestries-display_status": false,
      "tapestries-condition": "opened"
    },
    createdAt: "2026-01-02T09:00:00.000Z",
    updatedAt: "2026-01-10T12:00:00.000Z"
  },
  {
    id: "figure-limited-edition",
    goodsTypeId: "figures",
    name: "Limited Edition Scale Figure",
    imageAssetId: "asset-figure-limited-edition",
    customValues: {
      "figures-manufacturer": "Example Works",
      "figures-scale": "one_seventh",
      "figures-edition": true
    },
    createdAt: "2026-01-06T09:00:00.000Z",
    updatedAt: "2026-01-09T12:00:00.000Z"
  },
  {
    id: "figure-prize-release",
    goodsTypeId: "figures",
    name: "Prize Figure",
    imageAssetId: "asset-figure-prize-release",
    customValues: {
      "figures-scale": "non_scale",
      "figures-edition": false
    },
    createdAt: "2026-01-07T09:00:00.000Z",
    updatedAt: "2026-01-08T12:00:00.000Z"
  },
  {
    id: "acrylic-anniversary-stand",
    goodsTypeId: "acrylic-goods",
    name: "Anniversary Acrylic Stand",
    imageAssetId: "asset-acrylic-anniversary-stand",
    customValues: {
      "acrylic-goods-format": "stand",
      "acrylic-goods-event": "10th Anniversary Exhibition"
    },
    createdAt: "2026-01-04T09:00:00.000Z",
    updatedAt: "2026-01-07T12:00:00.000Z"
  }
]);

const ASSET_FIXTURES = Object.freeze([
  { id: "asset-tapestry-summer-festival", label: "SUMMER", width: 560, height: 792, color: "#267a73" },
  { id: "asset-tapestry-winter-cafe", label: "WINTER", width: 792, height: 560, color: "#536f91" },
  { id: "asset-tapestry-legacy-record", label: "LEGACY", width: 560, height: 792, color: "#876949" },
  { id: "asset-figure-limited-edition", label: "LIMITED", width: 560, height: 792, color: "#86556f" },
  { id: "asset-figure-prize-release", label: "PRIZE", width: 792, height: 560, color: "#5e6f42" },
  { id: "asset-acrylic-anniversary-stand", label: "ACRYLIC", width: 560, height: 792, color: "#3d7085" }
]);

function createFixtureAsset({ color, height, id, label, width }) {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${color}"/>`,
    `<rect x="32" y="32" width="${width - 64}" height="${height - 64}" rx="24" fill="#f5f7f7" opacity="0.92"/>`,
    `<circle cx="${width / 2}" cy="${height * 0.4}" r="${Math.min(width, height) * 0.2}" fill="${color}" opacity="0.8"/>`,
    `<text x="50%" y="72%" text-anchor="middle" font-family="sans-serif" font-size="${Math.round(Math.min(width, height) * 0.09)}" font-weight="700" fill="#172126">${label}</text>`,
    "</svg>"
  ].join("");
  const data = new Blob([svg], { type: "image/svg+xml" });

  return createAssetRecord(
    { data, height, id, mediaType: "image/svg+xml", width },
    { now: () => FIXTURE_TIMESTAMP }
  );
}

export function createDebugGoodsTypes() {
  return GOODS_TYPE_FIXTURES.map((record) =>
    createGoodsTypeRecord(record, { now: () => FIXTURE_TIMESTAMP })
  );
}

export function createDebugFieldDefinitions(goodsTypes = createDebugGoodsTypes()) {
  return goodsTypes.flatMap((goodsType) => {
    const builtInFields = createBuiltInFieldDefinitions({
      goodsTypeId: goodsType.id,
      generateId: (key) => `${goodsType.id}-${key}`,
      now: () => FIXTURE_TIMESTAMP
    });
    const customFields = (CUSTOM_FIELD_FIXTURES[goodsType.id] ?? []).map((field, index) =>
      createFieldDefinitionRecord(
        {
          ...field,
          id: `${goodsType.id}-${field.key}`,
          goodsTypeId: goodsType.id,
          position: builtInFields.length + index
        },
        { now: () => FIXTURE_TIMESTAMP }
      )
    );

    return [...builtInFields, ...customFields];
  });
}

export function createDebugItems() {
  return ITEM_FIXTURES.map((record) =>
    createItemRecord(record, { now: () => FIXTURE_TIMESTAMP })
  );
}

export function createDebugAssets() {
  return ASSET_FIXTURES.map(createFixtureAsset);
}
