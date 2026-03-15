# Quick Lineup Mobile Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship the final mobile Quick Lineup flow in builder v2 with v1-grade behavior parity, measured responsive layout, and store-native Zustand state.

**Architecture:** Keep `MobileLayout` as orchestration only and build Quick Lineup as a dedicated mobile mode. Reuse the existing v1 step/session helpers in `src/pages/builder/quick-lineup.ts` for robust navigation semantics, then wrap them in the v2 Zustand store so layout components stay thin. The visual implementation should follow the current mobile builder shell, shared sizing rules, and focused/overview design language instead of treating the reference doc or HTML as exact implementation specs.

**Tech Stack:** React, Zustand, Tailwind, Vitest, Testing Library, existing `BuilderPickerPanel`, existing mobile v2 measurement/layout helpers

---

**Status:** Done

**Last updated:** 2026-03-14

**Related docs:**
- Existing layout slice: `docs/plans/builder-v2-layouts.md`
- Visual references: `docs/references/quick-lineup-portrait.html`
- Visual references: `docs/references/quick-lineup-landscape.html`
- v1 quick-lineup logic: `src/pages/builder/quick-lineup.ts`
- v1 behavior coverage: `src/pages/builder/useBuilderViewModel.test.ts`

## Scope

- Add a real mobile Quick Lineup mode reachable from overview and focused mode
- Preserve the v1 quick-lineup workflow shape: clear active team on start, restore on cancel, keep progress on finish
- Preserve v1 robustness for step navigation, history-aware backtracking, jump-to-step, and slot-change reconciliation
- Render all four slots at once with integrated awakener, wheel, and covenant targets
- Support portrait and landscape layouts using measured available space, not hard-coded viewport assumptions
- Use the inline builder picker with `hideTabs` and automatic tab/selection routing from quick-lineup state
- Keep the mobile page behavior consistent with the current builder shell, scaling, and restrictions

## Out of Scope

- Desktop or tablet Quick Lineup UI
- Reordering or customizing the step sequence
- Drag-and-drop within Quick Lineup
- New builder rules around realms, duplicate handling, or support semantics
- Treating the reference HTML files as pixel-locked specs

## Behavior Contract

- Starting Quick Lineup snapshots the active team, then clears the active team slots and posse before step 1
- The step sequence remains `(awakener, wheel 1, wheel 2, covenant) x 4`, then posse
- Auto-advance after a picker selection uses `findNextQuickLineupStepIndex`, including skipping gear for empty slots
- Back uses history-aware navigation, not simple `currentIndex - 1`
- Tapping a slot portrait or gear target jumps to that exact step
- Clearing a slot or swapping slots during Quick Lineup reconciles the current step back to a valid target, matching v1 behavior
- Cancel restores the original team snapshot
- Finish keeps the current in-progress lineup and returns to overview

## Design Notes

- The HTML mockups are reference material for zoning, density, and tone only
- Actual card proportions should stay aligned with the current mobile overview/focused sizing language, especially wheel `aspect-[1/2]` and covenant square treatment
- Prefer fluid proportions and clamp floors over fixed pixel dimensions
- Use measured container space through `useMeasuredElementSize`; do not branch purely on `window.innerWidth`
- Landscape picker density is the primary watchpoint, so default-collapsed sort controls may be necessary there

## Risks / Watchpoints

- The current v2 store slice is not behaviorally equivalent to v1 yet; history and reconciliation must be restored before UI work builds on top of it
- Quick Lineup start/finish/cancel semantics touch team state, selection state, and picker tab state together, so regressions can be subtle
- Landscape height is tight once the picker search, filters, and grid are visible
- Slot cards need to stay legible on short devices without breaking the current builder shell height rules

## Progress Snapshot

- Done:
  - Restored v1-grade quick-lineup session semantics in the v2 Zustand store, including start-clear, cancel-restore, finish-keep, reconciliation, and regression coverage
  - Added dedicated mobile quick-lineup derivation helpers, layout metrics, and slot-card UI
  - Replaced the mobile quick-lineup stub with a real portrait/landscape implementation wired through the inline picker flow
  - Completed UI churn passes for covenant overlays, placeholder treatment, portrait/landscape card proportions, and shell containment
  - Verified the shipped builder route in Playwright and closed with `npm run verify`
- In progress:
  - None
- Next:
  - Archive this plan and continue broader mobile layout work under the builder v2 mobile slice
- Blockers:
  - Intermittent Firefox touch-emulation double-step remains unconfirmed on real hardware and is treated as emulator-only until reproduced

## Tracking Dock

| Slice | Owner Layer | Status | Notes |
|---|---|---|---|
| Store behavior parity | `src/pages/builder/v2/store/*` | Done | V1 session semantics restored with regression coverage |
| Quick-lineup derived helpers | `src/pages/builder/v2/mobile/*` | Done | Step labels, active target lookup, and slot metadata shipped |
| Responsive layout metrics | `src/pages/builder/v2/mobile/*` | Done | Portrait/landscape metrics and stable mode selection shipped |
| Slot card UI | `src/pages/builder/v2/mobile/quick-lineup/*` | Done | Portrait + landscape cards, covenant overlay, placeholder pass shipped |
| Mobile mode orchestration | `src/pages/builder/v2/mobile/*` | Done | `MobileLayout` now mounts the real quick-lineup mode |
| Integration + regression coverage | tests | Done | Store, layout, card, and mobile mode coverage landed |

## Verification

- `npm run test:unit -- src/pages/builder/v2/BuilderPlaceholders.test.tsx`
- `npm run test:unit -- src/pages/builder/v2/mobile/focused-card/FocusedLoadout.test.tsx src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx`
- Playwright verification on the live `/#/builder-v2` route for overview, focused, and quick-lineup empty/filled states
- `npm run verify`

### Task 1: Restore Quick Lineup Store Semantics

**Files:**
- Create: `src/pages/builder/v2/store/quick-lineup-slice.test.ts`
- Modify: `src/pages/builder/v2/store/quick-lineup-slice.ts`
- Modify: `src/pages/builder/v2/store/types.ts`
- Modify: `src/pages/builder/v2/store/selectors.ts`
- Reference: `src/pages/builder/quick-lineup.ts`

**Step 1: Write the failing tests**

Add focused store-level tests for:
- starting Quick Lineup snapshots and clears the active team
- skipping an empty awakener jumps to the next awakener step
- back follows history after manual step jumps
- cancel restores the original team
- finish keeps the mutated team
- clearing/swapping slots during Quick Lineup reconciles the current step like v1

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/builder/v2/store/quick-lineup-slice.test.ts`
Expected: FAIL because the current slice does not preserve v1 history/reconciliation/start-clearing behavior

**Step 3: Write minimal implementation**

Refactor the slice to reuse v1 session helpers instead of open-coding simplified index movement. Keep public store access ergonomic for v2 components, but make the internal state capable of:
- storing the original team snapshot
- clearing the team on start
- tracking current step through v1-compatible session logic
- reconciling session state after slot mutations

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/builder/v2/store/quick-lineup-slice.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/store/quick-lineup-slice.test.ts src/pages/builder/v2/store/quick-lineup-slice.ts src/pages/builder/v2/store/types.ts src/pages/builder/v2/store/selectors.ts
git commit -m "feat: restore quick lineup store semantics"
```

### Task 2: Add Quick Lineup Mobile Derivation Helpers

**Files:**
- Create: `src/pages/builder/v2/mobile/quick-lineup-model.ts`
- Create: `src/pages/builder/v2/mobile/quick-lineup-model.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- context label derivation for awakener, wheel, covenant, and posse steps
- active target derivation per slot
- slot lookup helpers for jump targets and active slot highlighting

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup-model.test.ts`
Expected: FAIL because the helper module does not exist yet

**Step 3: Write minimal implementation**

Create small pure helpers that convert store/session state into UI-ready values. Keep these helpers presentation-adjacent and avoid duplicating core quick-lineup session logic.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup-model.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/mobile/quick-lineup-model.ts src/pages/builder/v2/mobile/quick-lineup-model.test.ts
git commit -m "feat: add quick lineup mobile view helpers"
```

### Task 3: Add Quick Lineup Layout Metrics

**Files:**
- Create: `src/pages/builder/v2/mobile/quick-lineup-layout.ts`
- Create: `src/pages/builder/v2/mobile/quick-lineup-layout.test.ts`
- Reference: `src/pages/builder/v2/mobile/focused-layout.ts`
- Reference: `src/pages/builder/v2/mobile/mobile-layout-metrics.ts`

**Step 1: Write the failing tests**

Cover:
- portrait vs landscape mode selection from measured width/height
- card sizing stays fluid and clamped instead of pixel-locked
- landscape reserves enough space for the picker
- very short shells degrade gracefully without exploding card ratios

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup-layout.test.ts`
Expected: FAIL because the layout module does not exist yet

**Step 3: Write minimal implementation**

Create a pure metrics function that mirrors the focused/overview approach: use measured host space, derive orientation, and compute card/picker allocations with clamp floors.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup-layout.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/mobile/quick-lineup-layout.ts src/pages/builder/v2/mobile/quick-lineup-layout.test.ts
git commit -m "feat: add quick lineup mobile layout metrics"
```

### Task 4: Build the Quick Lineup Slot Card UI

**Files:**
- Create: `src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.tsx`
- Create: `src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx`

**Step 1: Write the failing tests**

Cover:
- active slot highlighting
- active target highlighting
- empty vs filled art states
- portrait and landscape gear arrangements
- click targets for portrait, wheels, and covenant

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx`
Expected: FAIL because the component does not exist yet

**Step 3: Write minimal implementation**

Build one reusable slot card component that uses the shared asset helpers and the derived quick-lineup helper data. Keep wheel and covenant visual treatment aligned with existing mobile cards.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.tsx src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx
git commit -m "feat: add quick lineup slot cards"
```

### Task 5: Wire the Mobile Quick Lineup Mode

**Files:**
- Create: `src/pages/builder/v2/mobile/MobileQuickLineup.tsx`
- Modify: `src/pages/builder/v2/mobile/MobileLayout.tsx`
- Modify: `src/pages/builder/v2/BuilderPickerPanel.tsx`

**Step 1: Write the failing tests**

Add mobile-mode integration tests for:
- entering Quick Lineup from overview
- returning to overview on finish/cancel
- picker assignment auto-advances correctly
- slot/gear taps jump to the right step
- portrait row layout and landscape split layout both render

**Step 2: Run test to verify it fails**

Run: `npm run test -- --run src/pages/builder/v2/mobile/MobileQuickLineup.test.tsx`
Expected: FAIL because the mobile mode is still a stub

**Step 3: Write minimal implementation**

Replace the stub Quick Lineup branch in `MobileLayout` with a dedicated component that:
- starts Quick Lineup on entry
- measures its container
- renders header, slot card rail, picker, and footer in portrait/landscape arrangements
- uses the store for navigation and selection routing
- exits cleanly back to overview on finish/cancel

If needed, make the smallest safe `BuilderPickerPanel` changes to support the inline mobile flow without regressing existing focused/overview behavior.

**Step 4: Run tests to verify it passes**

Run: `npm run test -- --run src/pages/builder/v2/mobile/MobileQuickLineup.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/mobile/MobileQuickLineup.tsx src/pages/builder/v2/mobile/MobileLayout.tsx src/pages/builder/v2/BuilderPickerPanel.tsx src/pages/builder/v2/mobile/MobileQuickLineup.test.tsx
git commit -m "feat: add mobile quick lineup mode"
```

### Task 6: Full Regression Pass and Reference Cleanup

**Files:**
- Modify: `docs/plans/quick-lineup-mobile.md`
- Modify: `docs/references/quick-lineup-portrait.html`
- Modify: `docs/references/quick-lineup-landscape.html`

**Step 1: Write or tighten any missing failing regression tests**

Add any last coverage gaps discovered during implementation, especially around landscape density, cancel/restore semantics, and backtracking after manual jumps.

**Step 2: Run targeted tests to verify failures**

Run the smallest relevant `npm run test -- --run ...` command for each added regression
Expected: FAIL before the fix, PASS after the fix

**Step 3: Update docs and references**

Bring the plan progress snapshot up to date and adjust the reference HTML files only if the shipped UI diverges meaningfully from the mockups.

**Step 4: Run the full verification set**

Run:
- `npm run lint`
- `npm run test:unit`
- `npm run verify`

Expected: PASS, or document any unrelated pre-existing blocker precisely

**Step 5: Commit**

```bash
git add docs/plans/quick-lineup-mobile.md docs/references/quick-lineup-portrait.html docs/references/quick-lineup-landscape.html
git commit -m "docs: finalize quick lineup mobile references"
```

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
