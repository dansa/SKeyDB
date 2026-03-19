# SKeyDB Backlog

Last updated: 2026-03-19

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

## Builder

- Investigate Firefox touch-simulation drag behavior in Builder V2 picker lists. Current state: `autoScroll={false}` is already set on the shared DnD context, but Firefox touch simulation can still scroll the picker while dragging a picker tile. Likely cause is native touch scrolling rather than DnD-kit auto-scroll. Do not blindly set `touch-action: none` on all picker tiles without real-device verification, since that may make the picker harder to scroll on actual mobile. If this becomes active work, verify on real touch hardware first and prefer a drag-handle approach over globally disabling touch scrolling on the whole tile.

## Database

- Finalize long-term DB scope beyond the current builder/collection data needs.
- Design richer modal/tab content for characters, wheels, covenants, and posses.
- **Tag-based stacking search with autofill:** Allow users to type partial tag names (e.g. "vuln") and autocomplete to `[Vulnerable]`, stacking multiple tag filters (e.g. `[Vulnerable][Poison]`) to find awakeners matching all selected tags. Requires rebuilding the search/filter system to support structured filter tokens alongside free-text search.

## Promotion rule

- When one of these items becomes active work, move it into `docs/roadmap.md` and create a dated plan in `docs/plans/`.
