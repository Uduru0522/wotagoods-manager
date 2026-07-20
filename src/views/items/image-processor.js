const OUTPUT_SIZES = Object.freeze({
  landscape: Object.freeze({ width: 792, height: 560 }),
  portrait: Object.freeze({ width: 560, height: 792 })
});

export function calculateCropRectangle(
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  positionX = 0.5,
  positionY = 0.5
) {
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = sourceWidth / sourceHeight;
  let width = sourceWidth;
  let height = sourceHeight;

  if (sourceRatio > targetRatio) {
    width = sourceHeight * targetRatio;
  } else {
    height = sourceWidth / targetRatio;
  }

  return {
    x: (sourceWidth - width) * Math.min(1, Math.max(0, positionX)),
    y: (sourceHeight - height) * Math.min(1, Math.max(0, positionY)),
    width,
    height
  };
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The image could not be processed.")),
      "image/jpeg",
      0.82
    );
  });
}

export async function processImageSource(source) {
  const output = OUTPUT_SIZES[source.orientation];

  if (!output) {
    throw new TypeError("Choose a supported image orientation.");
  }

  const bitmap = await createImageBitmap(source.file);
  const crop = calculateCropRectangle(
    bitmap.width,
    bitmap.height,
    output.width,
    output.height,
    source.positionX,
    source.positionY
  );
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    bitmap.close();
    throw new Error("Image processing is unavailable in this browser.");
  }

  canvas.width = output.width;
  canvas.height = output.height;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    output.width,
    output.height
  );
  bitmap.close();

  return {
    data: await canvasToBlob(canvas),
    height: output.height,
    mediaType: "image/jpeg",
    width: output.width
  };
}
