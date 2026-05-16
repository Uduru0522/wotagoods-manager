# Wotagoods Manager

A minimal desktop-style manager shell for a growing tapestry collection.

## Run Locally

This project has no external dependencies.

From this folder, start the local web server:

```powershell
npm start
```

Then open:

```text
http://localhost:4173
```

You can also open `index.html` directly in a browser, but the local server is recommended because it enables the web app manifest and service worker behavior used by installable web apps.

## Current scope

- Left navigation with five views:
  - Dashboard
  - Item details
  - Add item
  - Administration
  - Options
- Default dashboard view on startup.
- Placeholder panels for future database and settings features.
- Data-driven view registration in `src/views.js` for easier expansion.
- Web app manifest and service worker setup for local-first browser usage.

## Project Structure

```text
index.html                 App document shell
styles.css                 UI tokens, layout, responsive rules, animation rules
app.js                     Browser entry point
server.js                  Dependency-free local static server
service-worker.js          Offline/local-first asset cache
src/app-shell.js           App composition and startup
src/config.js              Shared application constants
src/dom.js                 Small DOM helper functions
src/icons.js               Navigation icon creation
src/navigation.js          Main view navigation
src/renderers.js           View renderer registry
src/service-worker-registration.js
src/storage.js             Local storage wrapper
src/theme.js               Theme state and persistence
src/view-router.js         Active view switching and transition timing
src/views.js               View definitions
```

## Extension Notes

- Add or modify views in `src/views.js`.
- Add a new view renderer in `src/renderers.js`, then point a view's `renderer` field to it.
- App-wide selectors and defaults live in `src/config.js`.
- Theme settings are managed through `src/theme.js`.
- Motion timing is controlled by `--motion-fast` in `styles.css`.
