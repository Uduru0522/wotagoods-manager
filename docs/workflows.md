# Workflows

This document specifies implemented and planned user workflows. Their data rules
come from [Domain Model](data-model.md), and their transactions follow
[Persistence](persistence.md).

## Create Goods Type

Status: implemented.

1. User opens Administration.
2. User chooses **Add goods type**.
3. User enters a display name and optional description.
4. The form validates required text and duplicate naming guidance.
5. A review step shows the resulting type and protected built-in fields.
6. Confirmation creates the goods type and built-in field definitions atomically.
7. Navigation refreshes and opens the new goods type.

Display names do not need to be globally unique, but the UI should warn when an
active type already uses the same normalized name. IDs are generated internally.
User mode persists the result in IndexedDB. Debug mode applies the same workflow
to temporary in-memory data that disappears when the page reloads.

## Add Item

Status: planned.

```mermaid
graph TD
  A["Open Add item"] --> B["Load goods type and active fields"]
  B --> C["Render empty form and required markers"]
  C --> D["Edit form values"]
  D --> E{"Add or change image?"}
  E -->|Yes| F["Choose and crop image"]
  F --> G["Keep processed preview in form state"]
  G --> D
  E -->|No| H{"Form valid?"}
  H -->|No| D
  H -->|Yes| I["Open review screen"]
  I --> J{"Confirm save?"}
  J -->|No| D
  J -->|Yes| K["Enter shared mutation state"]
  K --> L["Write asset and item in one transaction"]
  L --> M{"Transaction successful?"}
  M -->|Yes| N["Clear draft and show success"]
  M -->|No| O["Keep draft and show recoverable error"]
  N --> P["Leave mutation state"]
  O --> P
```

The draft and cropped image stay in UI memory until confirmation. Allowed crop
ratios are portrait `1:sqrt(2)` and horizontal `sqrt(2):1`.

## Manage Fields

Status: implemented.

Use **Manage fields** in visible UI. Do not expose terms such as column, object
store, or schema migration to ordinary users.

```mermaid
graph TD
  A["Open Manage fields"] --> B["Choose goods type"]
  B --> C{"Choose action"}
  C -->|Add| D["Configure new field"]
  C -->|Modify| E["Edit supported metadata"]
  C -->|Delete| F["Confirm soft deletion"]
  D --> G["Stage change in memory"]
  E --> G
  F --> G
  G --> H["Review staged changes"]
  H --> I{"Apply changes?"}
  I -->|No| J["Discard staged changes"]
  I -->|Yes| K["Validate complete change set"]
  K --> L{"Valid?"}
  L -->|No| H
  L -->|Yes| M["Enter shared mutation state"]
  M --> N["Apply records in one transaction"]
  N --> O{"Transaction successful?"}
  O -->|Yes| P["Clear staged changes"]
  O -->|No| Q["Keep staged changes and show error"]
  P --> R["Leave mutation state"]
  Q --> R
```

Rules:

- staged changes exist only in memory
- one staged change is allowed per field
- built-in fields cannot be deleted
- `id` and `name` cannot become optional
- deleting a field preserves existing item values
- the complete staged set is validated before opening a transaction

The current UI supports text, long text, number, date, yes/no, web-address, and
selection-list fields. Internal keys are generated once and are not exposed to
ordinary users. Selection options receive stable IDs. Existing options may be
extended but not removed.

Safe initial modifications:

- rename a display label
- change required to optional
- change field position
- add select options without invalidating existing values

Deferred migrations:

- change field data type
- make a field required while existing values are empty
- change a stable field key
- remove select options used by existing items

## Mutation State

```mermaid
stateDiagram-v2
  [*] --> Ready
  Ready --> Busy : mutation starts
  Busy --> Ready : committed
  Busy --> Error : failed or aborted
  Error --> Ready : acknowledged or retried
```

When busy, the application disables conflicting mutations and keeps progress
visible. Harmless reading and navigation remain available when the active flow
can survive navigation safely.
