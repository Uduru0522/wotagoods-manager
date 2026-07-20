const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const sourceDirectory = path.join(projectRoot, "src");
const MAX_MOTION_DURATION_MS = 200;
const LAYER_DEPENDENCIES = Object.freeze({
  application: new Set(["application", "data"]),
  data: new Set(["data"]),
  shared: new Set(["shared"])
});

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

function toProjectAssetPath(absolutePath) {
  return `./${path.relative(projectRoot, absolutePath).split(path.sep).join("/")}`;
}

function getSourceLayer(filePath) {
  const [layer] = path.relative(sourceDirectory, filePath).split(path.sep);
  return layer;
}

function verifyLayerBoundaries(moduleGraph) {
  moduleGraph.forEach((dependencies, sourcePath) => {
    const sourceLayer = getSourceLayer(sourcePath);
    const allowedLayers = LAYER_DEPENDENCIES[sourceLayer];

    if (!allowedLayers) {
      return;
    }

    dependencies.forEach((dependencyPath) => {
      const dependencyLayer = getSourceLayer(dependencyPath);

      if (!allowedLayers.has(dependencyLayer)) {
        throw new Error(
          `${toProjectAssetPath(sourcePath)} cannot import ${toProjectAssetPath(dependencyPath)}. ` +
            `The ${sourceLayer} layer may only depend on: ${[...allowedLayers].join(", ")}.`
        );
      }
    });
  });
}

function verifyNoModuleCycles(moduleGraph) {
  const states = new Map();
  const activePath = [];

  function visit(filePath) {
    if (states.get(filePath) === "visited") {
      return;
    }

    if (states.get(filePath) === "visiting") {
      const cycleStart = activePath.indexOf(filePath);
      const cycle = [...activePath.slice(cycleStart), filePath]
        .map(toProjectAssetPath)
        .join(" -> ");
      throw new Error(`Circular module dependency detected: ${cycle}`);
    }

    states.set(filePath, "visiting");
    activePath.push(filePath);
    (moduleGraph.get(filePath) ?? []).forEach(visit);
    activePath.pop();
    states.set(filePath, "visited");
  }

  moduleGraph.forEach((_, filePath) => visit(filePath));
}

function verifyJavaScriptSyntax() {
  const files = [
    ...collectJavaScriptFiles(sourceDirectory),
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

function verifyMarkdownLinks() {
  const markdownFiles = [
    path.join(projectRoot, "README.md"),
    ...fs
      .readdirSync(path.join(projectRoot, "docs"))
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => path.join(projectRoot, "docs", fileName))
  ];
  const linkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  markdownFiles.forEach((markdownPath) => {
    const sourceCode = fs.readFileSync(markdownPath, "utf8");

    for (const match of sourceCode.matchAll(linkPattern)) {
      const target = match[1].replace(/^<|>$/g, "");

      if (target.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(target)) {
        continue;
      }

      const relativePath = decodeURIComponent(target.split("#", 1)[0]);
      const linkedPath = path.resolve(path.dirname(markdownPath), relativePath);

      if (!fs.existsSync(linkedPath)) {
        throw new Error(
          `${toProjectAssetPath(markdownPath)} references missing document: ${target}`
        );
      }
    }
  });
}

function getModuleSpecifiers(sourceCode) {
  const specifiers = [];
  const staticImportPattern = /\b(?:import|export)\s+(?:[^"'()]*?\s+from\s*)?["']([^"']+)["']/g;
  const dynamicImportPattern = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g;

  for (const match of sourceCode.matchAll(staticImportPattern)) {
    specifiers.push(match[1]);
  }

  for (const match of sourceCode.matchAll(dynamicImportPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function verifyModuleGraph() {
  const indexHtml = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const sourceRoot = `${sourceDirectory}${path.sep}`;
  const scriptPattern = /<script\b[^>]*\bsrc="(?!https?:)([^"]+)"[^>]*>/g;
  const pendingFiles = [...indexHtml.matchAll(scriptPattern)].map((match) =>
    path.resolve(projectRoot, match[1])
  );
  const visitedFiles = new Set();
  const moduleGraph = new Map();

  while (pendingFiles.length > 0) {
    const filePath = pendingFiles.pop();

    if (visitedFiles.has(filePath)) {
      continue;
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Module graph references missing entry: ${toProjectAssetPath(filePath)}`);
    }

    visitedFiles.add(filePath);

    const sourceCode = fs.readFileSync(filePath, "utf8");
    const dependencies = [];

    getModuleSpecifiers(sourceCode).forEach((specifier) => {
      if (!specifier.startsWith(".")) {
        return;
      }

      const cleanSpecifier = specifier.split(/[?#]/, 1)[0];
      const importedPath = path.resolve(path.dirname(filePath), cleanSpecifier);

      if (!importedPath.startsWith(sourceRoot) || path.extname(importedPath) !== ".js") {
        throw new Error(
          `${toProjectAssetPath(filePath)} has unsupported browser import: ${specifier}`
        );
      }

      if (!fs.existsSync(importedPath)) {
        throw new Error(
          `${toProjectAssetPath(filePath)} imports missing module: ${specifier}`
        );
      }

      dependencies.push(importedPath);
      pendingFiles.push(importedPath);
    });

    moduleGraph.set(filePath, dependencies);
  }

  verifyNoModuleCycles(moduleGraph);
  verifyLayerBoundaries(moduleGraph);

  const sourceFiles = collectJavaScriptFiles(sourceDirectory);
  const unreachableFiles = sourceFiles.filter((filePath) => !visitedFiles.has(filePath));

  if (unreachableFiles.length > 0) {
    throw new Error(
      `Source modules are unreachable from index.html: ${unreachableFiles
        .map(toProjectAssetPath)
        .join(", ")}`
    );
  }

  return new Set(sourceFiles.map(toProjectAssetPath));
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
  const assets = new Set();

  for (const match of serviceWorker.matchAll(assetPattern)) {
    if (match[1] !== "./") {
      assertFileExists(match[1], "service-worker.js");
      assets.add(match[1]);
    }
  }

  return assets;
}

function verifyOfflineModuleCoverage(runtimeModules, serviceWorkerAssets) {
  const uncachedModules = [...runtimeModules].filter(
    (modulePath) => !serviceWorkerAssets.has(modulePath)
  );

  if (uncachedModules.length > 0) {
    throw new Error(
      `Runtime modules are missing from the service-worker cache: ${uncachedModules.join(", ")}`
    );
  }
}

function toMilliseconds(value, unit) {
  return unit === "s" ? Number.parseFloat(value) * 1000 : Number.parseFloat(value);
}

function verifyMotionDurations() {
  const stylesheet = fs.readFileSync(
    path.join(projectRoot, "src", "styles", "app.css"),
    "utf8"
  );
  const config = fs.readFileSync(path.join(projectRoot, "src", "app", "config.js"), "utf8");
  const tokenPattern = /--motion-[\w-]+:\s*([\d.]+)(ms|s)\s*;/g;
  const motionTokens = [...stylesheet.matchAll(tokenPattern)];

  if (motionTokens.length === 0) {
    throw new Error("No CSS motion timing tokens were found.");
  }

  motionTokens.forEach((match) => {
    const durationMs = toMilliseconds(match[1], match[2]);

    if (durationMs > MAX_MOTION_DURATION_MS) {
      throw new Error(
        `${match[0].trim()} exceeds the ${MAX_MOTION_DURATION_MS}ms motion limit.`
      );
    }
  });

  const phaseMatch = stylesheet.match(/--motion-phase:\s*([\d.]+)(ms|s)\s*;/);

  if (
    !phaseMatch ||
    toMilliseconds(phaseMatch[1], phaseMatch[2]) * 2 > MAX_MOTION_DURATION_MS
  ) {
    throw new Error(
      `Two content motion phases combined must be at most ${MAX_MOTION_DURATION_MS}ms.`
    );
  }

  const fallbackMatch = config.match(/fastFallbackMs:\s*(\d+)/);

  if (!fallbackMatch || Number.parseInt(fallbackMatch[1], 10) > MAX_MOTION_DURATION_MS) {
    throw new Error(`View motion fallback must be at most ${MAX_MOTION_DURATION_MS}ms.`);
  }
}

try {
  verifyJavaScriptSyntax();
  verifyDocumentAssets();
  verifyMarkdownLinks();
  const runtimeModules = verifyModuleGraph();
  verifyManifestAssets();
  const serviceWorkerAssets = verifyServiceWorkerAssets();
  verifyOfflineModuleCoverage(runtimeModules, serviceWorkerAssets);
  verifyMotionDurations();
  console.log("Static app verification passed.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
