# Database Review Remediation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:subagent-driven-development` if subagents are available. Steps use checkbox syntax for tracking.

**Goal:** Remove the cross-page ownership leaks, duplicated database infrastructure, and React lifecycle drift identified in the Wheels vs Awakener database review.

**Architecture:** Start by moving shared database contracts out of awakener-owned modules so both entities become peers inside a neutral database layer. Then extract the shared modal lifecycle, browse-state, and filter scaffolding into database-scope primitives, leaving only truly entity-specific browse/detail behavior in the awakener and wheel modules.

**Tech Stack:** React, React Router, TypeScript, existing database modal/popover stack, Vitest, Testing Library

---

**Status:** Draft

**Last updated:** 2026-04-19

**Related docs:**
- Review source: branch review of `database/wheels`
- Existing plan: `docs/plans/2026-04-18-database-wheels.md`

## Scope

- Fix the shared database ownership boundary so wheels no longer depend on awakener-specific shared contracts.
- Consolidate duplicated overlay/reference, browse-state, modal lifecycle, and filter-shell logic.
- Remove dead or half-wired cross-entity plumbing.
- Close the concrete React correctness issue where hidden modal search mutates while nested overlays own focus.
- Add regression coverage for the current review findings so the two database subpages stop drifting again.

## Out of Scope

- Visual redesign of either modal.
- Broad rethinking of wheel-vs-awakener content layout.
- New database features beyond what is required to remove drift and code smell.

## Guiding Decisions

- Keep `AwakenerDetailModal` and `WheelDetailModal` as separate top-level UI components.
- Extract shared behavior only when the behavior is meant to stay aligned.
- Prefer database-neutral naming for shared types and controllers.
- Delete dead abstractions if they are not fully wired by the end of the work.

## File Structure Targets

These structure decisions should guide the implementation:

- Shared database contracts should live under `src/domain/database-*` or `src/pages/database/*`, not under `awakeners-*`.
- Entity-specific adapters should stay in `awakeners-*` and `wheels-*`.
- Modal lifecycle/search/popover coordination should be exposed by shared hooks in `src/pages/database/`.
- Filter row rendering and shared browse-shell layout should be shared; entity-specific filter option lists should stay separate.

## Execution Order

### Task 1: Neutralize the Shared Database Contract

**Why first:** Everything else depends on a clean ownership boundary. Refactoring filters or modal hooks before this would lock in the wrong abstractions again.

**Files:**
- Modify: `src/domain/awakeners-database-view.ts`
- Modify: `src/domain/awakeners-database-reference-layer.ts`
- Modify: `src/domain/wheels-database-reference-layer.ts`
- Modify: `src/domain/awakeners-database-reference-info.ts`
- Modify: `src/domain/wheels-database-reference-info.ts`
- Modify: `src/pages/database/useDatabasePopoverController.ts`
- Create: one or more neutral shared modules under `src/domain/` for database reference-layer types and helpers
- Test: existing reference-layer and popover tests

- [ ] Define neutral shared database reference-layer types and move them out of awakener-owned naming.
- [ ] Update awakener code to adapt into the neutral contract instead of exporting the shared contract itself.
- [ ] Update wheel code to adapt into that same neutral contract as a peer entity.
- [ ] Update shared UI and popover code to import only the neutral database contracts.
- [ ] Run focused tests for shared popover/reference behavior.

**Verification**
- `npm test -- --run src/pages/database/useDatabasePopoverController.test.tsx src/pages/database/DatabaseReferencePopover.test.tsx`

### Task 2: Unify Overlay Reference Construction

**Why second:** Once the shared contract is neutral, the duplicated overlay builder logic can be removed without fighting type ownership.

**Files:**
- Modify: `src/domain/awakeners-database-reference-layer.ts`
- Modify: `src/domain/wheels-database-reference-layer.ts`
- Create or Modify: shared overlay-reference helper under `src/domain/`
- Test: add overlay-label / alias / accessibility coverage

- [ ] Write failing tests that assert overlay labels and aliases resolve consistently from both database subpages.
- [ ] Extract one shared overlay-to-reference builder.
- [ ] Rewire both awakener and wheel reference-layer builders to use that helper.
- [ ] Remove any duplicated overlay lookup code left behind.
- [ ] Re-run reference-layer and popover tests.

**Verification**
- `npm test -- --run src/pages/database/DatabaseReferencePopover.test.tsx src/pages/database/DatabaseRichTextContent.test.tsx`

### Task 3: Consolidate Browse-State and URL Mechanics

**Why third:** Filter UIs and page view-models sit on top of these controllers. We want the shared controller settled before simplifying the shells that consume it.

**Files:**
- Modify: `src/pages/database/useDatabaseBrowseState.ts`
- Modify: `src/pages/database/useWheelsDatabaseBrowseState.ts`
- Modify: `src/domain/database-browse-state.ts`
- Modify: `src/domain/wheels-database-browse-state.ts`
- Possibly Create: shared browse-state factory/helper module
- Test: `src/pages/database/useDatabaseBrowseState.test.tsx`
- Test: entity-specific browse-state domain tests

- [ ] Write failing tests that lock shared query/history semantics across both database entities.
- [ ] Extract shared replace-vs-push query/history behavior into one reusable controller/factory.
- [ ] Extract shared URL patching/parsing helpers where the two domain browse-state modules currently duplicate mechanics.
- [ ] Keep only entity-specific filter fields and default sort behavior in each entity adapter.
- [ ] Re-run both browse-state test suites.

**Verification**
- `npm test -- --run src/pages/database/useDatabaseBrowseState.test.tsx src/domain/wheels-database-browse-state.test.ts`

### Task 4: Extract Shared Detail Modal Lifecycle

**Why fourth:** This is where most of the React drift lives. Once the shared contract and browse-state are stable, we can safely raise the shared seam for modal behavior.

**Files:**
- Modify: `src/pages/database/useAwakenerDetailModalState.ts`
- Modify: `src/pages/database/useWheelDetailModalState.ts`
- Modify: `src/pages/database/useDatabaseDetailChrome.ts`
- Modify: `src/pages/database/useAwakenerDetailChrome.ts`
- Modify: `src/pages/database/useDetailEntitySearch.ts`
- Possibly Create: a neutral modal orchestration hook under `src/pages/database/`
- Test: `src/pages/database/AwakenerDetailModal.test.tsx`
- Test: `src/pages/database/WheelDetailModal.test.tsx`

- [ ] Write failing tests for shared Escape precedence and nested overlay/search interactions.
- [ ] Extract shared modal orchestration for search state, close precedence, popover dismissal, and overlay click behavior.
- [ ] Make both entity modal-state hooks compose that shared lifecycle layer.
- [ ] Remove the wheel modal’s unstable `search` object effect dependency as part of the extraction, not as a one-off tweak.
- [ ] Re-run both modal test suites.

**Verification**
- `npm test -- --run src/pages/database/AwakenerDetailModal.test.tsx src/pages/database/WheelDetailModal.test.tsx`

### Task 5: Fix Hidden Search Mutation While Nested Overlays Own Focus

**Why fifth:** This is the clearest shared correctness bug, but it should be fixed inside the extracted shared lifecycle/search model instead of patched in isolation.

**Files:**
- Modify: `src/pages/database/useDetailEntitySearch.ts`
- Modify: any shared modal lifecycle helper introduced in Task 4
- Test: add regression coverage in modal/search tests

- [ ] Add a failing regression test for typing while art viewer / popover trail focus is active.
- [ ] Scope global search capture so nested modal-owned surfaces can suppress it.
- [ ] Ensure hidden background search state does not change while nested overlays are active.
- [ ] Re-run the new regression plus both modal suites.

**Verification**
- `npm test -- --run src/pages/database/WheelDetailModal.test.tsx src/pages/database/AwakenerDetailModal.test.tsx`

### Task 6: Raise the Filter and Grid Abstraction Line

**Why sixth:** After browse-state is shared properly, we can simplify the duplicated UI shells without risking another rewrite.

**Files:**
- Modify: `src/pages/database/DatabaseFilters.tsx`
- Modify: `src/pages/database/WheelDatabaseFilters.tsx`
- Modify: `src/pages/database/CatalogFiltersShell.tsx`
- Modify: `src/pages/database/DatabaseGrid.tsx`
- Modify: `src/pages/database/WheelGrid.tsx`
- Modify: `src/components/ui/CollectionSortControls.tsx`
- Possibly Create: shared filter row descriptors/helpers
- Test: database page browse tests and any component tests needed

- [ ] Extract shared realm/rarity/search/count/sort rendering into database-scope components/helpers.
- [ ] Leave only entity-specific filter rows in the entity wrappers.
- [ ] Remove `ignoreGroupByRealmChange` by fixing the shared sort-control API to represent optional grouping honestly.
- [ ] Re-run browse/database page tests to confirm both subpages still behave correctly.

**Verification**
- `npm test -- --run src/pages/DatabasePage.test.tsx src/pages/database/DatabaseGrid.test.tsx`

### Task 7: Remove Dead or Half-Wired Cross-Entity Plumbing

**Why seventh:** Once the real shared boundaries exist, it will be obvious which transitional APIs are still needed and which should be deleted.

**Files:**
- Modify: `src/pages/database/AwakenerDetailModal.tsx`
- Modify: `src/pages/DatabasePage.tsx`
- Modify or Delete: `src/pages/database/buildWheelPopoverEntry.ts`
- Modify or Delete: `src/domain/wheels-database-reference-info.ts`
- Test: add or update route/popover tests if wiring remains

- [ ] Decide whether Awakener -> Wheel handoff is truly supported now.
- [ ] If yes, wire it end-to-end and add tests.
- [ ] If no, remove the dead `onSelectWheel` contract and any orphaned helper modules.
- [ ] Remove any unused wheel reference-info helper if it is not part of the final neutral architecture.
- [ ] Re-run targeted route and popover tests.

**Verification**
- `npm test -- --run src/pages/DatabasePage.test.tsx src/pages/database/AwakenerDetailModal.test.tsx`

### Task 8: Finish Drift Cleanup and Small React Regressions

**Why last:** These are cleanup items that should be fixed after the larger shared extractions, otherwise they may be rewritten during earlier tasks.

**Files:**
- Modify: `src/pages/database/useWheelsDatabaseViewModel.ts`
- Modify: `src/pages/database/useDatabaseViewModel.ts` if shared extraction changes the dependency style
- Modify: `src/pages/database/useAwakenerDetailChrome.ts`
- Test: add small regression coverage as needed

- [ ] Tighten the wheel view-model memo dependencies so they match the safer awakener pattern.
- [ ] Reset awakener tag expansion when switching records.
- [ ] Scan for remaining asymmetries left behind after the larger refactors and remove them.
- [ ] Re-run the relevant focused tests.

**Verification**
- `npm test -- --run src/pages/database/useAwakenerDetailSearch.test.tsx src/pages/database/AwakenerDetailModal.test.tsx`

## Final Verification Pass

- [ ] Run the focused database test suite:
  - `npm test -- --run src/pages/database/AwakenerDetailModal.test.tsx src/pages/database/WheelDetailModal.test.tsx src/pages/database/useDatabaseBrowseState.test.tsx src/pages/DatabasePage.test.tsx`
- [ ] Run the shared popover/rich-text coverage:
  - `npm test -- --run src/pages/database/useDatabasePopoverController.test.tsx src/pages/database/DatabaseReferencePopover.test.tsx src/pages/database/DatabaseRichTextContent.test.tsx`
- [ ] Run any entity-specific domain tests touched by the extraction:
  - `npm test -- --run src/domain/wheels-database-browse-state.test.ts src/domain/database-paths.test.ts`
- [ ] Run lint if the local invocation is repaired; otherwise note the limitation explicitly.

## Done Criteria

- Shared database contracts no longer live behind awakener-specific type names.
- Wheels and awakeners build reference layers through the same neutral contract.
- Shared browse-state/query/history logic exists in one place.
- Shared modal lifecycle and nested-overlay search suppression exist in one place.
- Filter/grid duplication is reduced to entity-specific content, not repeated scaffolding.
- Dead or half-wired cross-entity APIs are either fully implemented or removed.
- All review findings from the branch audit are addressed by code or by deletion of the smelly abstraction itself.
