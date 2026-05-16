# Wotagoods Manager

A local-first web app shell for managing multiple types of goods.

The current project is the application shell: navigation, responsive layout, theme handling, placeholder views, debug goods types, and extension points for the future database layer.

## Quick Start

This project has no external dependencies.

```powershell
npm start
```

Open the app:

```text
http://localhost:4173
```

Open debug mode with sample goods types:

```text
http://localhost:4173?debug=1
```

The server prints both URLs when it starts.

## Modes

User mode is the default. It expects goods types to come from the future database layer, so the goods-type list is empty for now.

Debug mode is enabled with `?debug=1`. It loads hardcoded goods types from `src/data/goods-types.js`. These values are not saved and are only for layout and flow testing.

## Current Scope

- Dashboard view.
- Goods-type navigation section.
- Per-type Item details child view.
- Per-type Add item child view.
- Administration view prepared for goods-type setup.
- Options view for app settings.
- Dark mode persisted in browser `localStorage`.
- Responsive wide/sidebar and narrow/top-navigation layouts.
- Local web app manifest and service worker registration.

## Project Map

```text
index.html                 App document shell
manifest.webmanifest       Installable web app metadata
package.json               npm scripts and project metadata
server.js                  Dependency-free local static server
service-worker.js          Offline/local-first asset cache

docs/                      Contributor documentation
icons/                     Web app icons
src/main.js                Browser entry point
src/app/                   App startup, config, mode, layout, routing
src/bootstrap/             Tiny blocking scripts that run before first paint
src/data/                  Data boundary and debug goods-type metadata
src/navigation/            Primary nav, utility nav, scroll behavior
src/services/              Browser services: storage, theme, service worker
src/shared/                Generic DOM, icon, drag-scroll, UI helpers
src/styles/                CSS tokens, layout, responsive rules, animation
src/views/                 View definitions and renderer registry
```

## Useful Docs

- [Architecture](docs/architecture.md): runtime flow, module boundaries, and extension points.
- [Development Notes](docs/development.md): common tasks, conventions, and browser storage details.

## Common Changes

- Add or modify views in `src/views/view-definitions.js`.
- Add custom view markup in `src/views/view-renderer.js`.
- Add debug goods types in `src/data/goods-types.js`.
- Change app constants in `src/app/config.js`.
- Change layout, colors, and motion in `src/styles/app.css`.

Do not treat debug data as persistence. The intended persistence integration point is `loadDatabaseGoodsTypes()` in `src/data/goods-types.js`.
