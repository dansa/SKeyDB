# SKeyDB Roadmap

Last updated: 2026-03-15

## Current priorities

### In-game codec completion

- Finish covenant support for `@@...@@` import/export.
- Finish posse support for `@@...@@` import/export.
- Remove WIP fallback behavior once those two blocks are supported for real.
- Reference:
  - `docs/notes/2026-02-27-ingame-team-codec-status.md`

### Persistence migration scaffolding

- Add a migration registry when the first real schema bump requires it.
- Keep boundary compatibility behavior explicit rather than scattering one-off fallbacks.
- Reference:
  - `docs/archive/plans/2026-02-22-persistence-plan.md`

## Next larger passes

- Builder v2 tablet layout bundle.
- Builder v2 desktop layout bundle.
- Share-via-link flow with safe overwrite UX.
- Multiple on-site saved planners.
- Database detail modal: Guide and Teams tab content (placeholder shells exist).
- Database advanced features (persistent filters, tag-based stacking search).

## Recently shipped foundations

- Builder v2 mobile builder slice, including quick-lineup mode, page snap/staging, no-horizontal-scroll tab compaction, and short-shell overflow handling.
- Repo strict TypeScript ESLint compliance cleanup, plus an optional isolated React sidecar lint diagnostic for high-value React rules.
- Database detail modal: Overview and Cards tabs with rich text parsing, interactive skill/tag popovers, deep-linked awakener routes, exact level 1-90 stat scaling, font size accessibility controls (S/M/L), and shared rendering infrastructure for future tabs.
- Database & Tools page initial pass with filters, search, sorting, basic modal.
- Multi-team builder and cross-team management.
- Compact `t1.` / `mt1.` import-export.
- Baseline in-game `@@...@@` import-export support.
- Builder and collection local persistence.
- Builder QOL stage 2 improvements.
- Realm terminology migration.

Reference history:

- `docs/archive/plans/`
- `docs/archive/roadmaps/2026-02-20-project-roadmap.md`
