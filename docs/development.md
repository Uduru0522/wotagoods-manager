# Development Notes

## Running The App

```powershell
npm start
```

Open:

```text
http://localhost:4173
```

Debug mode:

```text
http://localhost:4173?debug=1
```

The app can be opened directly through `index.html`, but the local server is preferred because manifest and service worker behavior are browser-origin dependent.

## Verification

Run the complete static and unit-test suite:

```powershell
npm run check
```

`npm run check` validates JavaScript syntax and referenced static assets, then
runs the dependency-free `node:test` suite in `test/`.

After runtime or layout changes, start the server and verify:

- `http://localhost:4173`
- `http://localhost:4173?debug=1`

## Browser Storage

Settings are stored in browser `localStorage`, not in project files.

Current keys:

```text
wotagoods.theme
```

Expected values:

```text
light
dark
```

In DevTools Console:

```js
localStorage.getItem("wotagoods.theme")
localStorage.removeItem("wotagoods.theme")
```

Collection data uses IndexedDB, not `localStorage`. User mode initializes the
database even while it contains no records. Debug mode uses a separate in-memory
adapter and never opens or writes the user database.

Browser storage is origin-specific. These locations do not share settings or
future IndexedDB data:

```text
http://localhost:4173/
https://uduru0522.github.io/wotagoods-manager/
```

Use versioned export/import to move a collection between origins, browsers, or
devices. Do not inspect or mutate IndexedDB directly from view modules.

## Adding A View

1. Add the definition in `src/views/view-definitions.js`.
2. Choose a `renderer` key.
3. If needed, add that renderer in `src/views/view-renderer.js`.
4. Add navigation metadata if it should appear in primary or utility navigation.

Keep route/view IDs stable. They are used by navigation state and router state.

## Adding A Goods Type For Debug Mode

Edit `GOODS_TYPE_FIXTURES` in `src/data/debug/debug-fixtures.js`.

Use stable IDs and domain-facing property names:

```js
{
  id: "example_goods",
  displayName: "Example goods",
  description: "Short description."
}
```

This is only debug data. `DebugStorage` clones these records and never writes them
to the user database.

## Theme Rules

Theme constants live in `src/app/config.js`.

Runtime theme changes are handled by `src/services/theme.js`.

First-paint theme is handled by `src/bootstrap/theme-bootstrap.js`. Keep that bootstrap file small and synchronous.

## CSS Rules

Main CSS lives in `src/styles/app.css`.

Prefer editing existing tokens before adding new hardcoded values. Important token groups:

- theme colors
- focus and accent tint colors
- scrollbar sizing
- navigation spacing
- motion timing

Responsive behavior currently has one breakpoint at `760px`, matching `APP_CONFIG.layout.narrowQuery`.

## Drag Scrolling

Shared pointer drag behavior lives in `src/shared/drag-scroll.js`.

Current users:

- main view panel vertical scrolling
- wide navigation vertical scrolling
- narrow navigation horizontal scrolling
- schema table horizontal scrolling

Use the shared helper for new draggable scroll areas instead of adding local pointer logic.

Narrow navigation also uses `src/navigation/scrollable-row.js` for wheel-to-horizontal scrolling and right-edge scroll hints.

## Service Worker Updates

When moving or adding app files that must work offline:

1. Add the path to `service-worker.js`.
2. Bump `CACHE_NAME`.
3. Verify the moved file is served by the local server.

Docs are not currently cached by the service worker.
