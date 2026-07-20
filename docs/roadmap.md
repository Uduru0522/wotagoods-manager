# Roadmap

This document is the source of truth for implementation status and milestone
order. It describes direction, not a release-date commitment.

## Completed Foundations

- responsive application shell
- primary, child, and utility navigation
- user and debug runtime modes
- theme persistence without first-paint flash
- offline app-shell service worker
- GitHub Pages deployment under a repository subpath
- domain goods-type records and storage errors
- isolated `DebugStorage`
- IndexedDB version-1 stores and indexes
- asynchronous storage initialization and retryable failures
- static checks and dependency-free unit tests

## Completed Stabilization Milestone

- restructured contributor documentation by ownership
- separated IndexedDB connection, request, repository, and adapter responsibilities
- separated startup coordination from runtime view assembly
- added strict validation before persisted records reach views
- added browser import-graph and offline-cache verification
- broadened startup, lifecycle, corruption, and transaction-failure tests

## Completed Goods-Type Creation Milestone

- create goods types from Administration
- create protected built-in field definitions atomically
- validate user input and normalized duplicate names
- refresh navigation after commit
- retain debug-mode isolation
- add mutation progress and recoverable failure UI

## Completed Manage Custom Fields Milestone

- list active field definitions for a selected goods type
- add text, number, date, boolean, URL, and select fields
- stage edits in memory and review them before applying
- preserve built-in field protections
- apply each reviewed change set atomically
- retain staged input after recoverable failures

## Current Product Milestone: Add Items

- generate forms from active field definitions
- validate built-in and custom values
- choose and crop one image to a supported paper ratio
- keep form and processed-image drafts in memory until confirmation
- review the complete item before saving
- write the item and optional image asset atomically
- retain input after recoverable failures

## Later Milestones

1. Browse, filter, and edit items.
2. Restore and purge soft-deleted records.
3. Export and validated import.
4. Optional Google Drive snapshots.
5. Evaluate live synchronization only after conflict semantics exist.

## Deliberate Non-Goals

- server-hosted user database
- multi-user accounts or permissions
- live Google Drive database access
- one physical IndexedDB store per goods type
- destructive field-type conversion in the initial field editor
