# SKeyDB Roadmap

Last updated: 2026-03-04

## Current priorities

### Database groundwork

- Keep builder, collection, search, and overview surfaces on `lite` datasets.
- Add `full` dataset loading only for future detail/database views.
- Apply the same split discipline to wheels if detail payloads grow in the same way.
- Reference:
  - `docs/notes/2026-03-02-database-split-notes.md`

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

- Mobile and compact builder layout pass.
- Share-via-link flow with safe overwrite UX.
- Multiple on-site saved planners.
- Database browsing surfaces and modal/detail UI.

## Recently shipped foundations

- Multi-team builder and cross-team management.
- Compact `t1.` / `mt1.` import-export.
- Baseline in-game `@@...@@` import-export support.
- Builder and collection local persistence.
- Builder QOL stage 2 improvements.
- Realm terminology migration.

Reference history:

- `docs/archive/plans/`
- `docs/archive/roadmaps/2026-02-20-project-roadmap.md`
