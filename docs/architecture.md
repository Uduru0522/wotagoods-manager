# Architecture

Wotagoods Manager is intentionally dependency-free for now. The code is organized so the app shell can stay stable while the future database layer, real forms, and item views are added.

## Runtime Flow

1. `index.html` loads `src/bootstrap/theme-bootstrap.js` before CSS. This applies the saved theme before first paint and prevents a light-mode flash.
2. `index.html` loads `src/styles/app.css`.
3. `src/main.js` imports `src/app/app-shell.js`.
4. `createApp()` creates the runtime mode, loads goods types, builds view definitions, creates services, creates navigation, and creates the router.
5. `start()` initializes theme, renders navigation, binds scroll behavior, opens the default view, and registers the service worker.

## Module Boundaries

### `src/app/`

Owns application assembly and app-level behavior.

- `app-shell.js`: composition root. Wires data, services, navigation, router, and startup behavior.
- `app-elements.js`: required DOM lookup for shell elements.
- `app-mode.js`: user/debug mode detection.
- `config.js`: shared constants for selectors, theme, layout, and defaults.
- `layout-transition.js`: wide/narrow breakpoint transition state.
- `view-router.js`: active view switching, title updates, and view transition timing.
- `view-scroll-state.js`: compact title-bar state based on view scroll position.

### `src/bootstrap/`

Contains scripts that must run before normal app startup. Keep this folder small.

- `theme-bootstrap.js`: reads `localStorage` directly and sets `data-theme` before CSS loads.

This duplicates a small part of `src/services/theme.js` on purpose. The service cannot run early enough to prevent first-paint theme flash.

### `src/data/`

Currently owns debug goods-type metadata. It will become the boundary between
application operations and persistence.

- `goods-types.js`: temporary debug records and the current loading integration
  point.

User mode currently returns no goods types because persistence is not implemented
yet. Debug mode returns hardcoded goods types for UI testing. The persistence
milestone will replace the direct loader with a storage contract and separate
IndexedDB and in-memory debug adapters.

### `src/navigation/`

Owns navigation rendering and navigation-specific scroll behavior.

- `navigation.js`: combines primary and utility navigation.
- `primary-navigation.js`: dashboard, goods types, goods child views, administration.
- `utility-navigation.js`: Options gear in the app chrome.
- `nav-items.js`: nav button/separator builders.
- `scrollable-row.js`: horizontal scroll behavior for narrow navigation.

Navigation is data-driven through each view's `nav` metadata.
Vertical drag scrolling is shared through `src/shared/drag-scroll.js`.

### `src/services/`

Owns browser/platform services.

- `storage.js`: namespaced localStorage wrapper with safe fallbacks.
- `theme.js`: app theme controller and persisted theme changes.
- `service-worker-registration.js`: service worker registration.

### `src/shared/`

Generic helpers that should not know about Wotagoods-specific features.

- `dom.js`: small DOM creation helper.
- `drag-scroll.js`: reusable pointer drag scrolling.
- `icons.js`: icon creation.
- `ui-components.js`: reusable view components.

### `src/styles/`

Contains app-wide CSS. `app.css` currently holds design tokens, layout, view styling, responsive rules, scrollbar styling, and animations.

Important tokens:

- `--motion-fast`: fast UI state changes.
- `--motion-layout`: wide/narrow layout settle animation.
- `--scrollbar-*`: app scrollbar styling.
- `--focus-ring`: keyboard focus outline color.
- `--accent-tint`: low-emphasis icon background.
- `--nav-child-indent`: wide sidebar child-view indent.

### `src/views/`

Owns view definitions and view rendering.

- `view-definitions.js`: source of truth for view IDs, titles, sections, nav metadata, and renderer keys.
- `view-metadata.js`: shared constants for view IDs, nav groups, nav kinds, and renderer keys.
- `view-renderer.js`: renderer registry and markup for placeholder, goods type, administration, and options views.

## View Model

Each view definition has an `id`, title metadata, a renderer key, and optional navigation metadata.

Primary navigation uses:

```js
nav: { group: "primary" }
```

Goods-type parent views use:

```js
nav: { group: "primary", kind: "goods-type" }
```

Goods-type child views use:

```js
nav: { group: "primary", kind: "goods-child", parentId: goodsType.id }
```

Options uses:

```js
nav: { group: "utility" }
```

## Data Model Direction

User mode will use IndexedDB through an application-owned storage contract.
Physical object stores remain stable; goods types, field definitions, and custom
values are records rather than generated database tables.

Planned storage adapters:

- `IndexedDbStorage`: persistent browser-local user data.
- `DebugStorage`: in-memory fixtures that never write user data.

Views, navigation, and renderers must not import IndexedDB APIs or object-store
names. They consume plain domain records and call application operations. This
also keeps versioned file import/export and a future Google Drive snapshot adapter
independent from UI components.

The current debug-only `tableName` property is legacy placeholder metadata. It
must not become part of the persistent domain model.

See `docs/data-model.md` for object stores, record shapes, transaction rules,
versioning, and mutation workflows.

### Persistence Integration Constraints

IndexedDB is asynchronous. When persistence work begins, the composition root
must select the adapter from app mode, await adapter initialization, and then load
goods types before constructing data-dependent views and navigation. Startup must
render an explicit loading state and a recoverable storage-error state rather
than silently treating a failed database as an empty collection.

Mutation coordination belongs at application level. Individual views request a
domain operation; they do not open transactions or independently manage global
busy state. Storage adapters are responsible for atomic writes and return plain
records or domain errors.

## Service Worker

`service-worker.js` caches app shell assets for local-first behavior. When paths change or cached app assets change, bump `CACHE_NAME` and update the asset lists.

The service worker intentionally lists module paths explicitly. That makes moved files visible during review and avoids hidden build steps.
