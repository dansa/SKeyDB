# Heavy Refactor Slices Plan

**Goal:** Track the larger cleanup/refactor slices discovered during the May 2026 Refactor Discipline scout pass.

**Architecture:** Keep this as a slice ledger, not a mandate to rewrite everything at once. Each slice should be implemented in its own bounded commit or short branch, with characterization first when behavior is not already pinned.

**Tech Stack:** TypeScript, React, Vite, Vitest, Zod, React Testing Library.

---

**Status:** Draft

**Last updated:** 2026-05-16

**Related docs:**
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`
- Test cleanup commit source: `aaa267a test: clean up noisy and slow suites`

## Scope

- Domain/data-access trust boundaries.
- D-Zone route, state, and view-model boundaries.
- Timeline data/model plumbing.
- Shared test infrastructure and harness ergonomics.
- Builder and collection domain/persistence utilities only when the slice is not blocked by upcoming UI reworks.

## Out of Scope

- Builder UI and collection UI rewrites.
- Broad public-data contract replacement in one pass.
- Visual redesigns.
- Dependency changes unless a slice explicitly requests a dependency review.

## Risks / Watchpoints

- Public V3 adapters have legacy compatibility behavior; refactors must preserve generated data interpretation.
- D-Zone route-state changes can silently break deep links if query-param behavior is not pinned first.
- Timeline category/banner data changes can affect visible ordering and archive visibility.
- Test infrastructure helpers should reduce repetition without hiding assertions behind opaque magic.

## Progress Snapshot

- Done:
  - Initial scout pass completed across domain/data-access, timeline, D-Zone, tests, TypeScript, and harness/scripts.
  - Small safe cleanup pass completed for D-Zone drawer timer cleanup, timeline category/tag helpers, and script execution hardening.
- In progress:
  - None.
- Next:
  - Pick one slice below and run it as a bounded worker-slice with targeted verification.
- Blockers:
  - Public V3 adapter and upgrade-patch slices need characterization before implementation.

## Slice Ledger

| ID | Slice | Status | Value | Scope | Recommended First Verification |
|----|-------|--------|-------|-------|--------------------------------|
| R1 | Public V3 detail adapter trust boundary | Proposed | High | Large domain/data-access | `npm run test:unit -- src/domain/public-detail-record-adapters.test.ts src/domain/public-data-runtime-boundary.test.ts src/data-access/public-data/repository.test.ts` |
| R2 | Upgrade patch schema and resolver typing | Proposed | High | Medium-large domain | `npm run test:unit -- src/domain/awakeners-full-resolver.test.ts src/domain/public-detail-record-adapters.test.ts` |
| R3 | Rich description token grammar dedupe | Proposed | Medium-high | Medium domain | `npm run test:unit -- src/domain/description-args.test.ts src/domain/database-rich-text.test.ts src/domain/public-description-args.test.ts` |
| R4 | D-Zone history route/view-model boundary | Proposed | High | Medium React/page model | `npm test -- --run src/pages/DZoneHistoryPage.test.tsx src/pages/d-zone/d-zone-history-view-model.test.ts --pool=forks --maxWorkers=1` |
| R5 | D-Zone season inspector state model | Proposed | Medium-high | Medium React/domain helper | `npm test -- --run src/pages/DZonePage.test.tsx src/pages/DZoneHistoryPage.test.tsx src/pages/d-zone/DZoneWaveCard.test.tsx --pool=forks --maxWorkers=1` |
| R6 | Timeline entity resolution preindex | Proposed | Medium-high | Medium timeline plumbing | `npm test -- --run src/pages/timeline/timelineArtworkModel.test.ts src/pages/timeline/BannerCard.test.tsx src/pages/timeline/EventList.test.tsx --pool=forks --maxWorkers=1` |
| R7 | Timeline derived pool builder extraction | Proposed | Medium-high | Medium domain | `npm test -- --run src/domain/timeline-data.test.ts --pool=forks --maxWorkers=1` |
| R8 | Shared jsdom layout/window test helpers | Proposed | Medium | Small-medium test infra | `npm test -- --run src/features/builder/BuilderPage.wheels.test.tsx src/pages/DZoneHistoryPage.test.tsx --pool=forks --maxWorkers=1` |
| R9 | Shared public catalog test fixtures | Proposed | Medium-high | Medium test infra | `npm test -- --run src/features/database/DatabaseRoutes.test.tsx src/features/collection/CollectionPage.test.tsx --pool=forks --maxWorkers=1` |

## R1: Public V3 Detail Adapter Trust Boundary

**Problem:** `public-detail-record-adapters.ts` owns validation, record loading, caching, child relationship assembly, and legacy adaptation. Several domain modules cast catalog/detail records before adapter schemas parse them.

**Value:**
- Clarifies the real trust boundary for public data.
- Reduces local `record as PublicV3*Record` casting in domain modules.
- Makes future public-data migrations easier to reason about.

**Likely files:**
- Modify: `src/domain/public-detail-record-adapters.ts`
- Modify: `src/domain/public-v3-awakener-record-adapters.ts`
- Modify: `src/domain/awakener-skills.ts`
- Modify: `src/domain/awakener-talents.ts`
- Modify: `src/domain/awakener-enlightens.ts`
- Modify: `src/domain/awakener-overlays.ts`
- Maybe create: `src/data-access/public-data/detailSchemas.ts`
- Test: `src/domain/public-detail-record-adapters.test.ts`
- Test: `src/domain/public-data-runtime-boundary.test.ts`

**Protected behavior:**
- Legacy public-v3 compatibility overrides.
- Existing detail record shapes consumed by database pages.
- Runtime validation remains at the data boundary.

**Characterization needed:**
- Yes. Pin the current adapter output for one skill, talent, enlighten, overlay, wheel, posse, and covenant before moving schemas.

**Stop condition:**
- Stop if narrowing the shared `PublicRecord` contract becomes necessary. That is a separate root-fix slice.

## R2: Upgrade Patch Schema And Resolver Typing

**Problem:** Upgrade patches are modeled as broad `operation?: string` plus `patch?: Record<string, unknown>`, then converted with terminal casts in the full awakener resolver.

**Value:**
- Makes invalid upgrade patch states unrepresentable.
- Removes risky casts around card keywords and resolver patch payloads.
- Gives future public-v3 upgrade edits a safer schema boundary.

**Likely files:**
- Modify: `src/domain/public-detail-record-adapters.ts`
- Modify: `src/domain/awakeners-full-resolver.ts`
- Test: `src/domain/awakeners-full-resolver.test.ts`
- Test: `src/domain/public-detail-record-adapters.test.ts`

**Protected behavior:**
- Existing card replacement/patch behavior.
- Unsupported operations should fail or noop exactly as they do today until explicitly changed.

**Characterization needed:**
- Yes. Add tests for each currently supported upgrade operation and at least one unsupported operation before changing parsing.

**Stop condition:**
- Stop if the slice requires changing generated public-v3 data format.

## R3: Rich Description Token Grammar Dedupe

**Problem:** Description argument token grammar and plural/ordinal macro rules are duplicated between `description-args.ts` and `rich-text.ts`.

**Value:**
- Prevents parser drift when adding new description argument syntax.
- Reduces regex maintenance risk.
- Keeps rich-text parsing and argument resolution aligned.

**Likely files:**
- Create: `src/domain/description-token-grammar.ts`
- Modify: `src/domain/description-args.ts`
- Modify: `src/domain/rich-text.ts`
- Test: `src/domain/description-args.test.ts`
- Test: `src/domain/database-rich-text.test.ts`
- Test: `src/domain/public-description-args.test.ts`

**Protected behavior:**
- Existing rendered rich segments.
- Current plural and ordinal macro output.
- Current behavior for unknown or malformed tokens.

**Characterization needed:**
- Light. Existing tests are strong, but add one shared-token test if the extraction creates a public helper.

**Stop condition:**
- Do not rewrite rich segment rendering in this slice.

## R4: D-Zone History Route/View-Model Boundary

**Problem:** `DZoneHistoryPage` owns URL parsing, selected season fallback, search, expanded year state, countdown, and URL mutation inline.

**Value:**
- Makes deep-link behavior easier to test without full page renders.
- Reduces the chance of future URL routing regressions.
- Gives the D-Zone history browser a clearer input model.

**Likely files:**
- Modify: `src/pages/DZoneHistoryPage.tsx`
- Modify: `src/pages/d-zone/d-zone-history-view-model.ts`
- Test: `src/pages/DZoneHistoryPage.test.tsx`
- Test: `src/pages/d-zone/d-zone-history-view-model.test.ts`

**Protected behavior:**
- `?season=` deep links.
- Unknown season fallback.
- Query param updates on selection.
- Default selected season and expanded year.

**Characterization needed:**
- Yes. Pin invalid `?season=...` fallback and preservation of unrelated query params before extracting.

**Stop condition:**
- Do not redesign the drawer or season inspector in this slice.

## R5: D-Zone Season Inspector State Model

**Problem:** `DZoneSeasonInspector` repairs selected alert and open wave state during render with season-id bookkeeping and repeated Set repair logic.

**Value:**
- Makes season/alert/wave transitions explicit and testable.
- Reduces render-time state repair complexity.
- Keeps future D-Zone data additions from breaking inspector state.

**Likely files:**
- Modify: `src/pages/d-zone/DZoneSeasonInspector.tsx`
- Maybe create: `src/pages/d-zone/d-zone-season-inspector-state.ts`
- Test: `src/pages/d-zone/d-zone-season-inspector-state.test.ts`
- Test: `src/pages/DZonePage.test.tsx`
- Test: `src/pages/DZoneHistoryPage.test.tsx`

**Protected behavior:**
- Season changes select the first valid alert.
- First wave starts open for a new season.
- User-opened wave state remains stable within the same season.

**Characterization needed:**
- Yes, direct state-helper tests before replacing component-local repair paths.

**Stop condition:**
- Do not move visual wave card layout or CSS.

## R6: Timeline Entity Resolution Preindex

**Problem:** Timeline asset/detail resolution repeatedly scans awakeners and wheels during render and preload setup. Pool banners amplify this cost.

**Value:**
- Reduces repeated lookup work in timeline rendering.
- Gives banner/event art resolution a clearer resolver boundary.
- Helps future large banner pools stay predictable.

**Likely files:**
- Modify: `src/pages/timeline/timelineDetailResolution.ts`
- Modify: `src/pages/timeline/timelineArtworkModel.ts`
- Test: `src/pages/timeline/timelineArtworkModel.test.ts`
- Test: `src/pages/timeline/BannerCard.test.tsx`
- Test: `src/pages/timeline/EventList.test.tsx`

**Protected behavior:**
- Current canonical-name matching.
- Existing database detail links.
- Existing asset choices for awakeners, wheels, and signature wheels.

**Characterization needed:**
- Light. Add tests for canonical name and signature wheel owner/name lookup before replacing scans.

**Stop condition:**
- Do not introduce alias matching unless explicitly requested.

## R7: Timeline Derived Pool Builder Extraction

**Problem:** `timeline-data.ts` owns Zod validation, art resolution, featured unit normalization, and derived premium pool generation in one module.

**Value:**
- Separates banner business rules from JSON loading.
- Makes derived pool rules easier to test before new banner types land.
- Reduces risk when adding exceptions like unavailable limited/collab units.

**Likely files:**
- Create: `src/domain/timeline-banner-pools.ts`
- Modify: `src/domain/timeline-data.ts`
- Test: `src/domain/timeline-data.test.ts`
- Maybe test: `src/domain/timeline-banner-pools.test.ts`

**Protected behavior:**
- Existing `derivedPool` output.
- Linked pair behavior.
- Current errors for missing SSR wheel pairs.

**Characterization needed:**
- Yes. Pin linked-pair and missing-wheel behavior before extraction.

**Stop condition:**
- Do not change banner JSON schema unless the slice explicitly expands.

## R8: Shared JSDOM Layout/Window Test Helpers

**Problem:** Layout-sensitive tests hand-roll `ResizeObserver`, `matchMedia`, `getBoundingClientRect`, and `offsetHeight` mocks with local restore logic.

**Value:**
- Reduces prototype/global leak risk.
- Makes future layout tests smaller and more consistent.
- Keeps test cleanup conventions centralized.

**Likely files:**
- Create: `src/test/domLayoutMocks.ts`
- Modify: `src/features/builder/BuilderPage.wheels.test.tsx`
- Modify: `src/pages/DZoneHistoryPage.test.tsx`

**Protected behavior:**
- Existing layout expectations.
- Existing focus/body-lock test behavior.

**Characterization needed:**
- No, if this is helper extraction only and tests are unchanged.

**Stop condition:**
- Do not refactor builder or collection product code.

## R9: Shared Public Catalog Test Fixtures

**Problem:** Full-page tests define similar mocked awakeners, wheels, posses, covenants, assets, and detail loaders in multiple places.

**Value:**
- Reduces mock drift across database, builder, and collection tests.
- Makes future public-data contract changes easier to update.
- Shrinks large page-level test files.

**Likely files:**
- Create: `src/test/publicCatalogFixtures.ts`
- Modify first: `src/features/database/DatabaseRoutes.test.tsx`
- Later modify: builder/collection test mocks only when their reworks are no longer imminent.

**Protected behavior:**
- Page-level tests should still verify real wiring, not bypass important UI flows.
- Fixture builders should be explicit and small, not a hidden fake app.

**Characterization needed:**
- No for the first database-only fixture extraction, as long as assertions stay the same.

**Stop condition:**
- Stop before migrating builder/collection UI tests unless their rework scope allows it.

## Suggested Execution Order

1. R8: Shared JSDOM layout/window test helpers.
2. R3: Rich description token grammar dedupe.
3. R4: D-Zone history route/view-model boundary.
4. R6: Timeline entity resolution preindex.
5. R7: Timeline derived pool builder extraction.
6. R1: Public V3 detail adapter trust boundary.
7. R2: Upgrade patch schema and resolver typing.
8. R5: D-Zone season inspector state model.
9. R9: Shared public catalog test fixtures.

## Standard Verification

Run targeted checks per slice first, then:

- `npm run format:check`
- `npm run lint`
- `npm run test:bounded`
- `npm run test:scripts`
- `npm run build:quiet`

## Archive Trigger

Move this file to `docs/archive/plans/` when all selected slices are completed, abandoned, or superseded by a new refactor plan.
