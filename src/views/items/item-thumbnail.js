import { createElement } from "../../shared/dom.js";

export function createItemThumbnail(item, getAsset) {
  const element = createElement("div", { className: "item-list-thumbnail" });
  let disposed = false;
  let imageUrl = "";

  function releaseImageUrl() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      imageUrl = "";
    }
  }

  if (item.imageAssetId) {
    getAsset(item.imageAssetId)
      .then((asset) => {
        if (!asset || disposed) {
          return;
        }

        imageUrl = URL.createObjectURL(asset.data);
        const image = createElement("img", { attributes: { alt: "" } });
        image.addEventListener("load", releaseImageUrl, { once: true });
        image.addEventListener("error", releaseImageUrl, { once: true });
        image.src = imageUrl;
        element.replaceChildren(image);
      })
      .catch((error) => {
        if (!disposed) {
          console.warn("Item image could not be loaded:", error);
        }
      });
  }

  return {
    element,
    destroy() {
      disposed = true;
      releaseImageUrl();
    }
  };
}
