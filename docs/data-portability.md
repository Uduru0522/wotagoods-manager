# Data Portability

This document defines future export, import, backup, and cloud-snapshot behavior.
No transfer feature is implemented yet.

## Why Export Is Required

Browser storage belongs to one origin and browser profile:

- localhost and GitHub Pages have separate databases
- another browser or device cannot see the collection automatically
- clearing site data removes the local collection

Export is therefore a data-safety feature, not only a convenience.

## Export Contract

Exports use a versioned, storage-neutral representation. They must not expose raw
IndexedDB transactions, index layouts, or browser-specific object identities.

The first implementation may use one JSON file with encoded image content for
portability. A later archive can store JSON metadata and binary image files while
preserving the same domain records.

Every export includes:

- export-format version
- domain-model version
- creation timestamp
- application identity
- goods types, field definitions, items, and assets

## Import Contract

Import validates the complete file before opening a mutation. The user chooses
an explicit strategy such as replace or, once designed, controlled merge. The
application must never silently combine collections.

Before destructive replacement or future migrations, the UI should offer an
export of the existing collection.

## Google Drive

The first Google Drive integration should upload and download complete export
snapshots. It is not a live database.

Live multi-device synchronization is deferred until these are designed:

- revision identity
- concurrent-edit conflicts
- deletion propagation
- authentication expiry
- offline changes
- user-visible recovery

## Retention Direction

1. Implement explicit local export and validated import.
2. Add backup reminders before destructive operations.
3. Add optional Google Drive snapshot upload and download.
4. Consider bounded automatic retention only after storage costs and conflict
   behavior are understood.
