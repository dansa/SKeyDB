# Database Refactor Changelog

**Status:** Done

**Last updated:** 2026-04-09

## Summary

Refactor of `src/pages/database` completed.

Main outcomes:
- `zustand` now owns database list/filter/sort state.
- `zustand` now owns awakener detail modal UI state.
- `AwakenerDetail` and `DatabaseMain` were split into clearer ownership layers.
- Rich text and popover code was decomposed into smaller modules.
- Database-related tests, lint, and full project verification passed.

## Changelog

### State

- Added `useDatabaseStore` for database query, filters, sort, and grouping state.
- Kept `useDatabaseViewModel` as a thin derived adapter over the store.
- Added `useAwakenerDetailModalStore` for modal tab, level, psyche surge, skill level, font scale, and menu state.
- Added reset helpers so store state does not leak across tests.

### AwakenerDetail

- Split build-related files into `AwakenerDetail/Builds`.
- Split detail controls into `AwakenerDetail/Controls`.
- Split detail content components into `AwakenerDetail/Content`.
- Split modal and sidebar composition into `AwakenerDetail/Shell`.
- Split modal Zustand ownership into `AwakenerDetail/State`.
- Added `index.ts` barrel files for `AwakenerDetail` layers and a top-level `AwakenerDetail/index.ts`.

### Modal

- Decomposed `AwakenerDetailModal` into thinner shells.
- Extracted modal topbar into `AwakenerDetailModalTopbar`.
- Extracted modal header and tab navigation into `AwakenerDetailModalHeader`.
- Extracted tab-content composition into `AwakenerDetailModalTabContent`.
- Preserved loading, escape handling, outside-click handling, body-scroll locking, and derived stat behavior.

### RichText

- Extracted shared rich-segment key helpers.
- Decomposed `RichSegmentRenderer` into a dispatcher plus leaf segment views.
- Decomposed `RichDescription` into a thinner composition component plus extracted trail/controller and entry helpers.
- Moved popover components into `components/RichTextPopovers`.
- Decomposed `PopoverTrailPanel` into thinner hooks and separate layout shells.

### DatabaseMain

- Moved filter display config out of `DatabaseFilters` into `database-filter-config.ts`.
- Added `DatabaseMain/index.ts` barrel exports.
- Switched page and detail consumers to shorter `DatabaseMain` imports.
- Cleaned up `DatabaseTabSection` collapse labels to ASCII-safe `Show` / `Hide`.

### Tests and Verification

- Added or updated targeted tests around stores, modal shells, detail content, controls, builds, rich text, popovers, and `DatabaseTabSection`.
- Passed wider database-focused verification:
  - `src/pages/database` lint
  - database-focused test sweep
- Passed final full-project verification:
  - `npm run format:check`
  - `npm run lint`
  - `npm run test -- --run`
  - `npm run build`

## Related Docs

- [docs/notes/2026-03-02-database-split-notes.md](C:/Users/Ansu/source/repos/SKeyDB/docs/notes/2026-03-02-database-split-notes.md)
- [docs/roadmap.md](C:/Users/Ansu/source/repos/SKeyDB/docs/roadmap.md)
- [docs/backlog.md](C:/Users/Ansu/source/repos/SKeyDB/docs/backlog.md)
