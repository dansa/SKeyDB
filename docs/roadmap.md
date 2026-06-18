# SKeyDB Roadmap

Last updated: 2026-05-05

## Current priorities

### Database search and content depth

- Keep the public V3 payload as the maintained website data boundary.
- Keep database detail loaders on public V3 records. The website should not read private compile outputs, retired public-data trees, or source/audit sidecars.
- Improve database browse ergonomics with better filtering, ranked search follow-through, and richer curated detail coverage where it is clearly worth the authoring cost.
- Keep future wheel, covenant, and posse detail surfaces as deliberate follow-on product work rather than reopening the awakener migration foundation.
- Keep soulforge-driven card/exalt scaling deferred unless a narrow curated subset becomes worth the manual authoring cost.
- Keep lower-priority niceties such as tag icons and tag-stacking search deferred until there is a concrete product need.
- References:
  - `docs/notes/2026-03-31-awakener-db-v2-data-model.md`
  - `docs/backlog.md`

### In-game codec completion

- Keep `t1.` / `mt1.` compact imports and exports stable through frozen codec tables.
- Finish covenant support for `@@...@@` import/export.
- Finish posse support for `@@...@@` import/export.
- Keep `@@...@@` in-game tokens marked WIP and not guaranteed until those two blocks are supported for real.
- Reference:
  - `docs/notes/2026-02-27-ingame-team-codec-status.md`

### Builder mobile and sharing follow-through

- Harden the public Builder V2 beta while keeping classic Builder accessible.
- Finish the mobile-first builder layout pass.
- Add share-via-link flows with safe overwrite UX.
- Decide how far to take multiple on-site saved planners beyond the current autosave/snapshot baseline.
- Reference:
  - `docs/backlog.md`

## Next candidates after the current priorities

- Collection bulk editing and faster ownership workflows.
- Timeline/resource page expansion if the supporting data curation becomes worth the maintenance cost.

## Recently shipped foundations

- Public V3 website data sync, including chunked public records for lazy database detail loading.
- Database Public V3 read model, selected-state resolver, generated lite projection, and canonical split dataset pipeline.
- Database detail modal: Overview, Cards, and Guide tabs with rich text parsing, interactive skill/tag popovers, draggable stacked references, modal jump search, persistent detail preferences, exact level 1-90 stat scaling, and shared rendering infrastructure for future tabs.
- Database & Tools page with filters, stronger ranked search, sorting, basic modal, and deep-linked awakener routes.
- Public-safe repo contract cleanup for contributors, including fresh-clone-safe `npm run verify`.
- Generated dimensional relic dataset with cleaned-up canonical descriptions.
- Multi-team builder and cross-team management.
- Builder V2 public beta access, with classic Builder still available and an opt-in default route.
- Compact `t1.` / `mt1.` import-export backed by frozen codec tables.
- Baseline in-game `@@...@@` import-export support, still WIP for unsupported covenant/posse token coverage.
- Builder and collection current local persistence using the shipped `skeydb.builder.v2` and `skeydb.collection.v2` storage keys.
- Builder QOL stage 2 improvements.
- Realm terminology migration.

Reference history:

- `docs/archive/plans/`
- `docs/archive/notes/`
- `docs/archive/roadmaps/2026-02-20-project-roadmap.md`
