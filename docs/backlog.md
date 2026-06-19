# SKeyDB Backlog

Last updated: 2026-05-05

This file is for ideas worth remembering but not currently scheduled.

## General UX and site polish

- Richer filters and taxonomy-driven search once the data model supports them.
- More hover/tooltips to explain truncated labels, statuses, and unusual controls.
- Lightweight page-level onboarding or getting-started guidance.
- Small “what changed since last visit” or changelog toast.
- Better public-facing contributor and acknowledgement section.
- Timeline/resources page expansion if we decide the project should surface more curated external links and event context.

## Collection

- Review whether the current side-filter layout should stay or move toward a top-toolbar layout.
- Add quick-select or paintbrush-style bulk editing for owned state, levels, and enlightens.

## Builder and persistence

- Continue hardening the public Builder V2 beta without removing classic Builder access.
- Finish the mobile-first builder layout pass.
- Add share-via-link flows with safe overwrite UX.
- Support multiple on-site saved planners beyond the current autosave plus manual snapshot model.
- Preserve current persisted storage-key compatibility for `skeydb.collection.v2` and `skeydb.builder.v2` during future schema changes.

## Database

- Design richer detail surfaces for wheels, covenants, and posses if those domains need the same depth as awakeners.
- **Soulforge card/exalt support:** A heuristic review showed the remaining cases are mostly mixed conditional behavior, effect injection, or enemy-specific modifiers rather than clean scalar upgrades. Keep full support deferred unless a small curated subset becomes worth the manual authoring and description work.
- **Tag-based stacking search with autofill:** Allow users to type partial tag names (e.g. "vuln") and autocomplete to `[Vulnerable]`, stacking multiple tag filters (e.g. `[Vulnerable][Poison]`) to find awakeners matching all selected tags. Requires rebuilding the search/filter system to support structured filter tokens alongside free-text search.
- **Tag icon pass:** The detail settings now persist a `Show tag icons` preference, but the actual icon pairing and rendering pass is still deferred until it is worth the manual lookup work.

## Promotion rule

- When one of these items becomes active work, move it into `docs/roadmap.md` and create a dated plan in `docs/plans/`.
