# SKeyDB Roadmap

Last updated: 2026-03-04

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

- Mobile and compact builder layout pass.
- Share-via-link flow with safe overwrite UX.
- Multiple on-site saved planners.
- Rich database detail views (cards, exalts, talents, enlightens).
- Database advanced features (persistent filters, export, deep linking).

## Recently shipped foundations

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
