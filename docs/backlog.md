# SKeyDB Backlog

Last updated: 2026-03-05

This file is for ideas worth remembering but not currently scheduled.

## General UX and site polish

- Richer filters and taxonomy-driven search once the data model supports them.
- More hover/tooltips to explain truncated labels, statuses, and unusual controls.
- Lightweight page-level onboarding or getting-started guidance.
- Small “what changed since last visit” or changelog toast.
- Better public-facing contributor and acknowledgement section.

## Collection

- Review whether the current side-filter layout should stay or move toward a top-toolbar layout.
- Add quick-select or paintbrush-style bulk editing for owned state, levels, and enlightens.

## Database

- Finalize long-term DB scope beyond the current builder/collection data needs.
- Design richer modal/tab content for characters, wheels, covenants, and posses.
- **Tag-based stacking search with autofill:** Allow users to type partial tag names (e.g. "vuln") and autocomplete to `[Vulnerable]`, stacking multiple tag filters (e.g. `[Vulnerable][Poison]`) to find awakeners matching all selected tags. Requires rebuilding the search/filter system to support structured filter tokens alongside free-text search.
- Level slider for dynamic stat scaling (L1–L90). Formula is proven, blocked on manual data collection. See `docs/notes/stat-scaling-analysis.md`.

## Promotion rule

- When one of these items becomes active work, move it into `docs/roadmap.md` and create a dated plan in `docs/plans/`.
