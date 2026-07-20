import { createActionButton } from "../../shared/action-button.js";
import { createElement } from "../../shared/dom.js";
import { processImageSource } from "./image-processor.js";

const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function updatePreviewPosition(source, image) {
  image.style.objectPosition = `${source.positionX * 100}% ${source.positionY * 100}%`;
}

function clampPosition(value) {
  return Math.min(1, Math.max(0, value));
}

function releaseProcessedImage(draft) {
  if (draft.processedImageUrl) {
    URL.revokeObjectURL(draft.processedImageUrl);
  }

  draft.image = null;
  draft.processedImageUrl = "";
}

export function clearItemImageDraft(draft) {
  releaseProcessedImage(draft);

  if (draft.imageSource?.previewUrl) {
    URL.revokeObjectURL(draft.imageSource.previewUrl);
  }

  draft.imageSource = null;
}

export async function prepareItemImage(draft) {
  if (!draft.imageSource) {
    releaseProcessedImage(draft);
    return null;
  }

  if (!draft.image) {
    draft.image = await processImageSource(draft.imageSource);
    draft.processedImageUrl = URL.createObjectURL(draft.image.data);
  }

  return draft.image;
}

export function createItemImageField({ draft, field }) {
  const section = createElement("section", { className: "item-image-field" });
  const heading = createElement("div", { className: "editor-label" });
  const picker = createElement("label", { className: "item-image-picker" });
  const input = createElement("input", {
    attributes: { accept: "image/*", type: "file" },
    className: "item-image-input"
  });
  const controls = createElement("div", { className: "item-image-controls" });
  const feedback = createElement("p", {
    attributes: { "aria-live": "polite" },
    className: "form-feedback"
  });

  heading.append(createElement("strong", { textContent: field?.displayName ?? "Image" }));
  picker.append(input);
  picker.addEventListener("click", (event) => {
    if (draft.imageSource && event.target !== input) {
      event.preventDefault();
    }
  });

  function render() {
    picker.querySelectorAll(":scope > :not(input)").forEach((element) => element.remove());
    controls.replaceChildren();

    if (!draft.imageSource) {
      picker.classList.remove("has-image");
      picker.append(
        createElement("span", { className: "item-image-prompt", textContent: "Choose image" })
      );
      return;
    }

    const source = draft.imageSource;
    const image = createElement("img", {
      attributes: {
        alt: "Selected item crop",
        draggable: "false",
        src: source.previewUrl,
        title: "Drag to adjust crop"
      }
    });
    const modes = createElement("div", {
      attributes: { "aria-label": "Image orientation", role: "group" },
      className: "item-image-modes"
    });
    const removeButton = createActionButton("Remove", { className: "secondary-action" });

    picker.classList.add("has-image", `is-${source.orientation}`);
    picker.classList.remove(
      source.orientation === "portrait" ? "is-landscape" : "is-portrait"
    );
    updatePreviewPosition(source, image);
    picker.append(image);

    ["portrait", "landscape"].forEach((orientation) => {
      const button = createActionButton(
        orientation === "portrait" ? "Portrait" : "Landscape",
        { className: "item-image-mode" }
      );
      button.setAttribute("aria-pressed", String(source.orientation === orientation));
      button.addEventListener("click", () => {
        source.orientation = orientation;
        releaseProcessedImage(draft);
        render();
      });
      modes.append(button);
    });

    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    image.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
      initialX = source.positionX;
      initialY = source.positionY;
      image.setPointerCapture(event.pointerId);
      picker.dataset.dragging = "true";
    });
    image.addEventListener("pointermove", (event) => {
      if (!image.hasPointerCapture(event.pointerId)) {
        return;
      }

      source.positionX = clampPosition(
        initialX - (event.clientX - startX) / picker.clientWidth
      );
      source.positionY = clampPosition(
        initialY - (event.clientY - startY) / picker.clientHeight
      );
      releaseProcessedImage(draft);
      updatePreviewPosition(source, image);
    });
    image.addEventListener("pointerup", (event) => {
      image.releasePointerCapture(event.pointerId);
      delete picker.dataset.dragging;
    });
    removeButton.addEventListener("click", () => {
      clearItemImageDraft(draft);
      input.value = "";
      render();
    });
    controls.append(modes, removeButton);
  }

  input.addEventListener("change", async () => {
    const [file] = input.files;

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/") || file.size > MAX_SOURCE_BYTES) {
      input.value = "";
      feedback.textContent = "Choose a supported image smaller than 20 MB.";
      return;
    }

    let bitmap;

    try {
      bitmap = await createImageBitmap(file);
    } catch {
      input.value = "";
      feedback.textContent = "This image format could not be opened.";
      return;
    }

    const orientation = bitmap.width >= bitmap.height ? "landscape" : "portrait";
    bitmap.close();
    clearItemImageDraft(draft);
    draft.imageSource = {
      file,
      orientation,
      positionX: 0.5,
      positionY: 0.5,
      previewUrl: URL.createObjectURL(file)
    };
    feedback.textContent = "";
    render();
  });

  section.append(heading, picker, controls, feedback);
  render();
  return section;
}
