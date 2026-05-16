const CACHE_NAME = "wotagoods-manager-v42";

const ASSET_GROUPS = {
  app: [
    "./src/app/app-elements.js",
    "./src/app/app-shell.js",
    "./src/app/config.js",
    "./src/app/layout-transition.js",
    "./src/app/view-scroll-state.js",
    "./src/app/view-router.js"
  ],
  core: [
    "./",
    "./index.html",
    "./src/bootstrap/theme-bootstrap.js",
    "./src/main.js",
    "./src/styles/app.css"
  ],
  data: [
    "./src/data/goods-types.js"
  ],
  install: [
    "./manifest.webmanifest",
    "./icons/icon-192.svg",
    "./icons/icon-512.svg"
  ],
  navigation: [
    "./src/navigation/navigation.js",
    "./src/navigation/nav-items.js",
    "./src/navigation/primary-navigation.js",
    "./src/navigation/scrollable-row.js",
    "./src/navigation/utility-navigation.js"
  ],
  services: [
    "./src/services/service-worker-registration.js",
    "./src/services/storage.js",
    "./src/services/theme.js"
  ],
  shared: [
    "./src/shared/drag-scroll.js",
    "./src/shared/dom.js",
    "./src/shared/icons.js",
    "./src/shared/ui-components.js"
  ],
  views: [
    "./src/views/view-definitions.js",
    "./src/views/view-metadata.js",
    "./src/views/view-renderer.js"
  ]
};

const APP_ASSETS = Object.values(ASSET_GROUPS).flat();

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
