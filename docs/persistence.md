# Persistence

This document describes the current IndexedDB implementation and the boundaries
that future mutations must preserve.

## Runtime Adapters

Application startup selects one adapter:

- `IndexedDbStorage` for user mode
- `DebugStorage` for debug mode

Both implement the contract in `src/data/contracts/storage-contract.js` and
return plain domain records. Views must not receive `IDBRequest`,
`IDBTransaction`, object-store names, or browser storage events.

Debug mode uses cloned fixtures and performs writes only in memory. It never opens
IndexedDB. User mode never falls back to debug data when storage fails.

## Database Identity

```text
Name:    wotagoods-manager
Version: 1
```

Adding a goods type or custom field is normal data mutation and never changes the
IndexedDB version. Version upgrades are reserved for physical stores and indexes.

## Object Stores

| Store | Key path | Current indexes | Purpose |
| --- | --- | --- | --- |
| `goods_types` | `id` | `by_updated_at` | Goods-type records |
| `field_definitions` | `id` | `by_goods_type`, unique `by_goods_type_and_key` | Field metadata |
| `items` | `id` | `by_goods_type`, `by_goods_type_and_updated_at` | Items for every type |
| `assets` | `id` | none | Processed image Blobs |
| `app_metadata` | `key` | none | Domain-level metadata |

Boolean values are not valid IndexedDB index keys. Active/deleted filtering is
performed after an indexed parent query at the expected collection size.

## Current Storage Contract

Implemented capabilities:

```text
initialize
listGoodsTypes
createGoodsType
close
```

`createGoodsType` accepts a validated goods-type record and its field definitions.
The contract grows only when an application operation needs it. Planned
capabilities include field changes, item writes with optional assets, and
versioned transfer operations. Do not add speculative adapter methods.

## Transactions

Domain operations choose the complete object-store set before opening a
transaction. Asynchronous image processing, confirmation, and validation happen
before the transaction begins.

Examples:

- creating a goods type uses one `goods_types` + `field_definitions` transaction
- creating an item and its image uses one `assets` + `items` transaction
- applying field changes uses one `field_definitions` transaction
- future type-changing field migrations include `items` in the same transaction

Application-level busy state prevents conflicting UI operations. IndexedDB
transaction atomicity protects committed data.

The debug adapter performs all validation and duplicate checks before mutating
its arrays, preserving the same all-or-nothing behavior without persistence.

## Errors

Storage adapters translate browser failures into `StorageError` values with a
stable code. Current codes cover unavailable storage, failed initialization,
blocked upgrades, invalid adapters, uninitialized use, and failed operations.

UI code may select a user message from the code. It must not depend on browser
event types or parse error-message strings.

Startup behavior:

1. render a loading state
2. initialize the selected adapter
3. load goods types
4. construct data-dependent views
5. render a retryable error if initialization fails

A failed database must never look like a valid empty collection.

## Connection Lifecycle

- Repeated initialization is idempotent.
- `close()` releases the active connection.
- `versionchange` closes stale connections so another tab can upgrade.
- blocked upgrades return an actionable error asking the user to close other tabs.
- future application teardown must close storage without racing initialization.

## Record Validation

Records are validated at storage boundaries:

- before a domain record is written
- after untrusted persisted or imported data is read
- before a record is returned to application code

Invalid persisted data produces a domain storage error. It is not silently
discarded or repaired. Recovery and import tools can be added deliberately later.

## Version Responsibilities

Three independent versions are required:

1. **IndexedDB version** changes stores and indexes.
2. **Domain-model version** changes record meaning or shape.
3. **Export-format version** changes portable file representation.

`app_metadata` currently stores:

```js
{ key: "domainModelVersion", value: 1 }
```

Upgrades must be deterministic and remain inside the IndexedDB upgrade
transaction. Data migrations that cannot safely complete there require a
separate, resumable migration design.

## Source Ownership

```text
src/application/       Storage-neutral operations that request adapter writes
src/data/contracts/    Adapter contract and storage errors
src/data/debug/        In-memory fixtures and debug adapter
src/data/indexeddb/    Schema, connection, requests, repositories, adapter
src/data/models/       Domain record construction and validation
src/data/transfer/     Future versioned import/export mapping
```

Do not create an empty directory before its first module exists.
