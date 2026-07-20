const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");

function collectJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectJavaScriptFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".js") ? [entryPath] : [];
  });
}

function assertFileExists(relativePath, source) {
  const normalizedPath = relativePath.replace(/^\.\//, "");
  const absolutePath = path.join(projectRoot, normalizedPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${source} references missing file: ${relativePath}`);
  }
}

function verifyJavaScriptSyntax() {
  const files = [
    ...collectJavaScriptFiles(path.join(projectRoot, "src")),
    path.join(projectRoot, "server.js"),
    path.join(projectRoot, "service-worker.js")
  ];

  files.forEach((filePath) => {
    const result = spawnSync(process.execPath, ["--check", filePath], {
      encoding: "utf8"
    });

    if (result.status !== 0) {
      throw new Error(result.stderr || `Syntax check failed: ${filePath}`);
    }
  });
}

function verifyDocumentAssets() {
  const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const assetPattern = /(?:href|src)="(?!https?:|data:|#)([^"]+)"/g;

  for (const match of indexHtml.matchAll(assetPattern)) {
    assertFileExists(match[1], "index.html");
  }
}

function verifyManifestAssets() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "manifest.webmanifest"), "utf8")
  );

  manifest.icons.forEach((icon) => assertFileExists(icon.src, "manifest.webmanifest"));
}

function verifyServiceWorkerAssets() {
  const serviceWorker = fs.readFileSync(path.join(projectRoot, "service-worker.js"), "utf8");
  const assetPattern = /"(\.\/[^"\r\n]+)"/g;

  for (const match of serviceWorker.matchAll(assetPattern)) {
    if (match[1] !== "./") {
      assertFileExists(match[1], "service-worker.js");
    }
  }
}

try {
  verifyJavaScriptSyntax();
  verifyDocumentAssets();
  verifyManifestAssets();
  verifyServiceWorkerAssets();
  console.log("Static app verification passed.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
