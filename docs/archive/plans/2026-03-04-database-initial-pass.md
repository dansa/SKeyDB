# Database & Tools Page - Initial Pass

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a working database page with filtering, search (including tags), sorting, and basic detail modal.

**Architecture:** Database page uses lite awakeners dataset for grid display. View model handles filtering/sorting/search. Detail modal lazy-loads full awakener data on demand. Domain-first design: filters and search in domain layer, UI consumes.

**Tech Stack:** React, TypeScript, Fuse.js (fuzzy search), existing collection sorting utilities

---

**Status:** Done

**Last updated:** 2026-03-04

**Related docs:**
- Notes: `docs/notes/2026-03-02-database-split-notes.md`
- Roadmap item: `docs/roadmap.md` - Database groundwork

## Scope

- Database page route and navigation
- WIP disclaimer banner with emoji
- Filter bar: realm, rarity, type filters
- Search input with tag support and fuzzy matching
- Sort controls: alphabetical, rarity, ATK, DEF, CON
- Group by realm toggle
- Grid display with awakener cards showing stats
- Basic detail modal with tabs (Overview, Cards, Exalts, Talents, Enlightens)
- Test coverage for new features

## Out of Scope

- Advanced detail modal content (placeholder structure only)
- Mobile-specific layout optimizations
- Persistent filter/sort preferences
- Deep linking to specific awakeners

## Risks / Watchpoints

- Tag search precision: "STR Up" should not match "STR Down" (addressed with exact match first, then fuzzy)
- Performance: full awakeners-full.json loaded on first detail modal open (lazy loading mitigates)
- Data integrity: awakeners-lite.json must have type, stats, tags (validated via tests)

## Progress Snapshot

- Done:
  - UI structure with filters, search, grid, detail modal
  - Tag search in awakeners-search with stricter fuzzy threshold
  - Stat sorting (ATK, DEF, CON) in database view model
  - getMainstatIcon helper for stat display
  - WIP disclaimer banner
  - 18 new tests (domain + integration)
- Blockers:
  - None

## Verification

- `npm run lint` ✅
- `npm run test` ✅ (358/358 passing)

---

## Completed Tasks

### Task 1: Data model updates

**Files:**
- Modified: `src/data/awakeners-lite.json` (renamed type values)
- Modified: `src/data/awakeners-full.json` (renamed type values)
- Modified: `src/domain/awakeners.ts` (added type, stats, tags fields)
- Modified: `src/domain/mainstats.ts` (added getMainstatIcon)
- Test: `src/domain/awakeners.test.ts` (added type/stats/tags validation)
- Test: `src/domain/mainstats.test.ts` (added icon tests)

### Task 2: Tag search implementation

**Files:**
- Modified: `src/domain/awakeners-search.ts` (added tags to searchable fields)
- Test: `src/domain/awakeners-search.test.ts` (added tag search tests)
- Created: `src/data/tags.json` (31 unique tags extracted)

### Task 3: Database page and view model

**Files:**
- Created: `src/pages/DatabasePage.tsx`
- Created: `src/pages/database/useDatabaseViewModel.ts`
- Created: `src/pages/database/DatabaseFilters.tsx`
- Created: `src/pages/database/DatabaseGrid.tsx`
- Created: `src/pages/database/AwakenerGridCard.tsx`
- Created: `src/pages/database/AwakenerDetailModal.tsx`
- Created: `src/pages/database/AwakenerDetailOverview.tsx`
- Created: `src/pages/database/AwakenerDetailCards.tsx`
- Created: `src/pages/database/AwakenerDetailExalts.tsx`
- Created: `src/pages/database/AwakenerDetailTalents.tsx`
- Created: `src/pages/database/AwakenerDetailEnlightens.tsx`
- Modified: `src/App.tsx` (renamed route from /characters to /database)
- Test: `src/pages/DatabasePage.test.tsx` (11 integration tests)

### Task 4: Sorting updates

**Files:**
- Modified: `src/domain/collection-sorting.ts` (added ATK, DEF, CON sort keys)
- Modified: `src/components/ui/CollectionSortControls.tsx` (added stat labels)

---

## Next Steps (Out of Plan Scope)

These belong in future plans or backlog:

1. **Rich detail modal content:**
   - A lot of design work, restructuring and other things needed.
   - Scope and plan other tabs, like curated content as recommended wheels, stats/covenant builds, enlighten levels, teams etc (all derived from json data as things get added).

2. **Mobile layout:**
   - Compact filter bar for small screens
   - Responsive grid columns
   - Touch-friendly sort controls

3. **Advanced features:**
   - Persistent filter state in URL or local storage
   - Deep linking (`/database/:awakenerName`)

4. **Data expansion:**
   - Wheel data in database
   - Covenant data in database
   - Posse data in database

5. **Polish:**
   - Loading states for detail modal
   - Empty state illustrations
   - Keyboard navigation
   - Accessibility audit

## Archive Trigger

This plan is now complete. Move to `docs/archive/plans/` after updating roadmap.
