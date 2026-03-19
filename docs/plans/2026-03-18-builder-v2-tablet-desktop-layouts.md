# Builder V2 Tablet/Desktop Layouts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish Builder V2 tablet first, then desktop, by reusing the new V2 store/actions/picker architecture while restoring the missing non-mobile builder behaviors and visuals that still only exist in V1, while keeping both non-mobile builder stages locked to a consistent 4x1 layout.

**Architecture:** Keep business rules in the existing builder domain helpers and keep transient/non-mobile UI orchestration inside `src/pages/builder/v2/*`. Tablet and desktop should share one non-mobile builder stage built on the V2 Zustand store, V2 picker/actions, and V2 DnD boundary; desktop should then become a mostly layout-only follow-up on top of the tablet/shared stage. Do not band-aid V1 components into V2 wholesale; port behavior into the current V2 structure and only reuse V1 leaf components/helpers where they already fit cleanly.

**Tech Stack:** React, TypeScript, Zustand, dnd-kit, Vitest, Tailwind CSS

---

**Status:** In progress

**Last updated:** 2026-03-19

**Related docs:**
- Notes: None yet
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`

## Scope

- Complete the tablet Builder V2 shell with picker-on-top, fixed 4x1 builder card row, team tabs/header, quick-lineup controls, and teams management panel.
- Build the missing shared non-mobile builder-stage pieces in V2 so tablet and desktop use the same state/actions instead of diverging.
- Port the missing builder-card hover/remove/DnD parity that currently exists in V1 but is only partially surfaced in V2.
- Preserve the V1 non-mobile type-to-search autofocus QoL so typing routes into the active picker search even when the search field is not focused.
- Ship the desktop Builder V2 shell as a follow-on layout pass using the shared non-mobile stage and V1-style picker-right placement/sticky behavior.

## Out of Scope

- Reworking the mobile V2 view-state machine or redesigning the mobile shell.
- Large art-direction changes that move away from the current Builder V2 / repo visual language.
- Reintroducing every legacy V1 interaction immediately if it threatens the tablet-first bundle; specifically, cross-team preview-slot DnD in the teams panel can stay deferred unless tablet/desktop parity work proves it is required.
- Finalizing the exact minimum readable tablet card width beyond implementing a first safe clamp and leaving the threshold explicit.
- Forcing full touch drag-and-drop parity on tablet if browser scroll/gesture constraints make it unreliable; in that case, the fallback is to keep tap-to-assign and quick-lineup as the primary tablet interaction path and document the limitation clearly.

## Risks / Watchpoints

- Desktop picker placement should stay on the right, matching V1.
- `BuilderCardGrid` reuses the shared V1 `AwakenerCard`, but V2 does not yet feed it the transient drag-hover state that powers active hover borders and inferred wheel/covenant targets.
- Quick-lineup logic already lives in the V2 store; duplicating the mobile quick-lineup behavior in ad hoc tablet/desktop local state would create churn and regressions.
- Tablet and desktop must stay 4x1 always. Any responsive work must scale width, spacing, and clamps, not column count.
- V1’s keyboard search-capture QoL is currently missing from V2 non-mobile flow and should be treated as expected parity, not an optional polish item.
- Tablet touch DnD may be constrained by browser scroll gesture behavior. Treat this as an explicit investigation: first try low-churn mitigations such as sensor tuning, drag activation tuning, targeted `touch-action` changes, or temporary scroll suppression during active drag; if those are not reliable enough, keep click-to-assign/quick-lineup as the primary supported tablet path instead of overengineering the drag path.

## Progress Snapshot

- Done:
  - Audited current V2 mobile/tablet/desktop shells, shared V2 store/actions, and V1 desktop parity behaviors.
  - Identified the main reusable V2 surfaces: `BuilderPickerPanel`, `BuilderTeamsPanel`, `BuilderV2Toolbar`, `TeamTabs`, `TeamHeader`, `BuilderV2ActiveTeamHeader`, store slices, and `useBuilderV2Actions`.
  - Identified the main missing pieces: non-mobile quick-lineup surface, tab/header/card-stage parity, DnD hover visuals, wheel/covenant active removal, support-level display parity, and desktop shell completion.
  - Added the first shared non-mobile team stage for tablet, including tabs, active-team header, fixed 4x1 card grid, and quick-lineup controls backed by the existing V2 store.
  - Reworked tablet to use picker-on-top, shared team stage in the middle, and teams panel below.
  - Added targeted regression coverage for the shared team stage and tablet layout contract.
  - Reworked tablet tabs/header into a denser V2-specific chrome pass: attached single-row tabs, mobile-style active underline treatment, and a compact active-team row better suited to picker-on-top layouts.
  - Added a first tablet viewport-fit pass: tighter picker height clamp plus compact non-mobile card aspect ratio now keeps the full 4x1 team stage visible at normal tablet sizes in browser validation, with only the teams panel remaining below the fold.
  - Replaced the tablet tab overflow strip with a fitted single-row rail that keeps V1-style one-line behavior without horizontal scrolling.
  - Replaced the fixed compact tablet card ratio with responsive card-height scaling: roomy tablet viewports stay at full art ratio, while tighter portrait tablet heights shrink the row toward the readable floor instead of compacting by default.
  - Extracted shared tablet viewport metrics so picker height and builder-card scaling now come from the same tablet budget helper instead of separate hardcoded heuristics.
  - Rebuilt the tablet shell around a measured snapped main zone: picker height is now negotiated inside that zone, the builder stage fills the remainder, and card scaling is derived from the measured stage body height instead of reserve constants.
  - Moved tablet toolbar presentation to a mobile-style utility row above picker tabs while keeping it outside the snapped picker+builder zone.
  - Folded the tablet toolbar and picker into one shared shell so the toolbar no longer floats above the picker with duplicate borders.
  - Rebalanced tablet height budgeting so the builder stage caps at its natural 4-card content height and extra vertical room flows back into the picker instead of creating empty floor below the cards.
  - Fixed dense tablet tabs to fill the full row width again while keeping low-count tabs visually capped.
  - Fixed the shared measured-rect hook so tablet viewport budgeting re-measures on scroll/viewport movement instead of drifting until the next resize.
  - Corrected the shared builder exit-zone snap so mobile/tablet teams sections snap to their top edge again instead of pinning their bottom edge.
  - Reused the mobile current-team action controls in both mobile and tablet via a shared `CurrentTeamActionBar`, so compact tablet now follows the same rename/reset/quick-lineup ownership split instead of duplicating rename inside the compact identity header.
  - Simplified the compact tablet header into an identity-only row with clickable posse access, matching the intended mobile-style structure where quick-lineup steps replace the action bar in the same top-stage slot when active.
  - Restored V1-style type-to-search capture in the V2 picker panel, so typing outside the search field appends to the active picker search and focuses the input again.
  - Added a V2-local transient DnD state bridge so the shared `AwakenerCard` once again receives `activeDragKind` and `predictedDropHover`, restoring predicted wheel/covenant hover states on the non-mobile card grid without moving drag state into Zustand.
  - Finished non-mobile active remove parity for the shared card stack by clearing active wheel and covenant selections directly from the V2 card grid path, including a new covenant remove affordance on the shared covenant tile.
  - Extended predicted drop-hover resolution to include awakener drags over nested wheel/covenant zones, so the parent card keeps its active hover treatment even when the pointer is over child drop targets.
  - Disabled `DndContext` auto-scroll in V2 so drag gestures stop pulling the page/viewport when the pointer nears the viewport edge during wheel/covenant assignment.
  - Flattened the tablet shell width contract so it no longer reserves a fake page-level minimum width inside the viewport; tablet now reuses the full page width more like mobile, removes the hidden compact-stage `35rem` floor, and applies the deliberate `600px` DOM floor at the outer tablet page wrapper instead of on the inner builder shell.
  - Re-centered mobile and tablet scroll-snap ownership on the actual viewport-filling main zones (`mobile-overview`/focused/quick-lineup screens and the tablet main zone) instead of their outer shells, so snapping lands on the correct screen while the outer shell now only owns shared chrome.
  - Added a shared V2 `BuilderToolbarShell` so mobile and tablet use the same toolbar wrapper/border treatment while keeping their actual snapped main zones separate from toolbar chrome.
  - Added a first tablet-only wide picker body in `BuilderPickerPanel`: tabs still stay on top, but tablet now moves search/sorting/filters into a scrollable left rail and gives results the full remaining height in a separate right pane, preserving existing V2 picker state/actions.
  - Re-split the tablet wide picker so the left rail owns the full body height while picker tabs now sit above only the results column, reclaiming enough vertical room for denser tabs like Wheels without inventing a second tablet picker mode.
  - Locked the tablet snapped main zone to the shared `600px` minimum height contract, so short tablet heights now stop shrinking the overall builder area and hand overflow back to the page instead of crushing the builder stage below its readable card floor.
- In progress:
  - Desktop completion remains the active follow-on for Builder V2 after the tablet/shared-stage slice shipped.
- Next:
  - Finish the desktop Builder V2 shell on top of the shipped shared non-mobile stage and top-level shared V2 helpers.
  - Revisit any folder-ownership split, including a possible dedicated `/tablet` area, only after desktop work makes the shared vs. tablet-only boundaries clearer.
- Blockers:
  - None.

## Reuse Targets

- Reuse V2 state and orchestration as-is:
  - `src/pages/builder/v2/store/*`
  - `src/pages/builder/v2/useBuilderV2Actions.ts`
  - `src/pages/builder/v2/useBuilderPickerState.ts`
  - `src/pages/builder/v2/BuilderPickerPanel.tsx`
  - `src/pages/builder/v2/BuilderTeamsPanel.tsx`
  - `src/pages/builder/v2/BuilderV2Toolbar.tsx`
  - `src/pages/builder/v2/TeamTabs.tsx`
  - `src/pages/builder/v2/TeamHeader.tsx`
  - `src/pages/builder/v2/BuilderV2ActiveTeamHeader.tsx`
- Reuse legacy domain/helpers instead of re-implementing rules:
  - `src/pages/builder/team-state.ts`
  - `src/pages/builder/team-collection.ts`
  - `src/pages/builder/quick-lineup.ts`
  - `src/pages/builder/transfer-resolution.ts`
  - `src/pages/builder/predicted-drop-hover.ts` or a V2-local helper with the same pure boundary
- Reuse shared leaf visuals carefully:
  - `src/pages/builder/AwakenerCard.tsx`
  - `src/pages/builder/CardWheelZone.tsx`
  - `src/pages/builder/CardWheelTile.tsx`
  - `src/pages/builder/CardCovenantTile.tsx`

## Gap Summary

- `BuilderTabletLayout.tsx` is currently a placeholder shell: picker, tabs, header, and cards render, but the teams panel is absent and the local Quick Lineup button has no wiring.
- `BuilderDesktopLayout.tsx` is also incomplete: it shows toolbar/header/cards/teams/picker, but it still lacks tabs and a proper shared builder-stage flow.
- V2 DnD mutations work, but the non-mobile cards do not receive `activeDragKind` or `predictedDropHover`, so V1-style active hover borders and inferred wheel/covenant hover states never render.
- `BuilderCardGrid.tsx` only clears active awakener selections; wheel/covenant remove affordances are not fully wired in V2.
- V2 non-mobile card data is not at V1 parity for support-adjusted ownership/level visuals.
- Desktop parity extras such as outside-click selection dismissal and keyboard search capture are not yet clearly restored in V2 non-mobile flow and need an explicit pass.
- Tablet touch DnD usability is an open product/technical gap, especially for dragging from picker to cards while the page wants to scroll.

## Verification

- `npm run lint`
- `npm run test:integration`
- `npm run verify`

### Task 1: Lock The Non-Mobile Contract In Tests

**Files:**
- Create: `src/pages/builder/v2/BuilderTabletLayout.test.tsx`
- Create: `src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.test.tsx`

**Step 1: Write the failing test**

- Add tablet tests that assert:
  - picker renders above the builder stage
  - team tabs/header/cards/teams panel all appear in the tablet shell
  - tablet stays in a 4-card horizontal builder stage contract
- Add desktop tests that assert:
  - desktop renders the same shared builder stage plus teams panel
  - picker is rendered as a side rail in the desktop shell
  - the desktop shell contract makes picker-side placement explicit
- Extend `BuilderV2Page.test.tsx` so layout-mode routing covers mobile, tablet, and desktop contracts instead of only shallow smoke coverage.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
Expected: FAIL because the current tablet and desktop shells do not expose the required structure/behavior.

**Step 3: Write minimal implementation**

- Add the missing test IDs/structural hooks needed to make tablet and desktop layout contracts explicit.
- Update `BuilderV2Page.tsx`, `BuilderTabletLayout.tsx`, and `BuilderDesktopLayout.tsx` only enough to satisfy the contract shape before deeper behavior work starts.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/BuilderTabletLayout.tsx src/pages/builder/v2/BuilderDesktopLayout.tsx
git commit -m "test: lock builder v2 non-mobile layout contracts"
```

### Task 2: Build A Shared Non-Mobile Builder Stage

**Files:**
- Create: `src/pages/builder/v2/BuilderTeamStage.tsx`
- Create: `src/pages/builder/v2/BuilderQuickLineupControls.tsx`
- Create: `src/pages/builder/v2/BuilderTeamStage.test.tsx`
- Modify: `src/pages/builder/v2/BuilderCardGrid.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.tsx`
- Modify: `src/pages/builder/v2/BuilderTabletLayout.tsx`
- Modify: `src/pages/builder/v2/BuilderDesktopLayout.tsx`

**Step 1: Write the failing test**

- Add tests that assert the shared team stage:
  - renders team tabs plus the active team header area
  - shows quick-lineup start/status/back/skip/cancel/finish controls backed by the V2 store
  - keeps a four-card horizontal stage without column switching
  - can render in a more compact tablet mode without changing ownership boundaries
  - stays 4x1 in both tablet and desktop variants

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTeamStage.test.tsx`
Expected: FAIL because the shared stage does not exist yet.

**Step 3: Write minimal implementation**

- Create a shared non-mobile team-stage component that owns:
  - tabs
  - active-team header variant
  - quick-lineup controls/status
  - `BuilderCardGrid`
- Keep quick-lineup state in the existing V2 store slices; do not clone the mobile view-state machine.
- Give `BuilderCardGrid` the props/hooks it needs to support tablet compaction while preserving the fixed 4x1 builder contract.
- Move tablet and desktop shells to compose this shared stage rather than stitching together partially overlapping header/card pieces separately.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTeamStage.test.tsx src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderTeamStage.tsx src/pages/builder/v2/BuilderQuickLineupControls.tsx src/pages/builder/v2/BuilderTeamStage.test.tsx src/pages/builder/v2/BuilderCardGrid.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/BuilderTabletLayout.tsx src/pages/builder/v2/BuilderDesktopLayout.tsx
git commit -m "feat: add shared builder v2 non-mobile team stage"
```

### Task 3: Finish Tablet Layout First

**Files:**
- Modify: `src/pages/builder/v2/BuilderTabletLayout.tsx`
- Modify: `src/pages/builder/v2/BuilderCardGrid.tsx`
- Modify: `src/pages/builder/v2/BuilderTeamsPanel.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.tsx`
- Modify: `src/pages/builder/v2/BuilderTabletLayout.test.tsx`

**Step 1: Write the failing test**

- Add tablet-specific regression tests that assert:
  - picker stays above the builder stage
  - the teams panel is present below the builder stage
  - the general builder stays 4x1 at tablet sizes
  - tablet card sizing clamps down without switching to fewer columns
  - quick-lineup entry is wired through the shared stage rather than a dead local button

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTabletLayout.test.tsx`
Expected: FAIL because current tablet layout is missing the teams panel and complete quick-lineup wiring.

**Step 3: Write minimal implementation**

- Rework `BuilderTabletLayout.tsx` so it becomes the first complete non-mobile shell:
  - toolbar at top
  - picker docked above the builder stage
  - shared builder stage below picker
  - teams panel below the builder stage
- Keep the tablet builder visually closer to mobile than desktop, but enforce one horizontal four-card row at all times.
- Implement a first-pass readable width clamp instead of allowing the cards to shrink indefinitely.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderTeamsPanel.test.tsx src/pages/builder/v2/TeamTabs.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderTabletLayout.tsx src/pages/builder/v2/BuilderCardGrid.tsx src/pages/builder/v2/BuilderTeamsPanel.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx
git commit -m "feat: complete builder v2 tablet layout shell"
```

### Task 4: Port Card DnD Hover And Active-Remove Parity

**Files:**
- Create: `src/pages/builder/v2/BuilderDndStateContext.tsx`
- Create: `src/pages/builder/v2/BuilderCardGrid.test.tsx`
- Modify: `src/pages/builder/v2/BuilderDndProvider.tsx`
- Modify: `src/pages/builder/v2/useBuilderV2Dnd.ts`
- Modify: `src/pages/builder/v2/BuilderCardGrid.tsx`
- Modify: `src/pages/builder/v2/support-display.ts`
- Modify: `src/pages/builder/predicted-drop-hover.ts`

**Step 1: Write the failing test**

- Add card-grid tests that assert:
  - dragging wheels/covenants over a card activates the same inferred hover target visuals as V1
  - card-level hover borders light up during active slot drag
  - wheel/covenant active remove actions actually clear the selected item in V2
  - support cards show the same support-adjusted ownership/level visuals expected by the shared card component

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderCardGrid.test.tsx`
Expected: FAIL because V2 currently does not propagate live drag-hover state or clear wheel/covenant selections correctly.

**Step 3: Write minimal implementation**

- Keep transient drag-hover state local to the DnD boundary via context or an equivalent local provider.
- Reuse the existing pure predicted-hover resolver shape instead of adding hover state to Zustand.
- Thread `activeDragKind` and `predictedDropHover` into `BuilderCardGrid`/`AwakenerCard`.
- Finish the V2 active-remove handlers for wheel and covenant selection states.
- Restore support/non-default level/ownership parity that the shared V1 card expects.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderCardGrid.test.tsx src/pages/builder/v2/BuilderV2Page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderDndStateContext.tsx src/pages/builder/v2/BuilderCardGrid.test.tsx src/pages/builder/v2/BuilderDndProvider.tsx src/pages/builder/v2/useBuilderV2Dnd.ts src/pages/builder/v2/BuilderCardGrid.tsx src/pages/builder/v2/support-display.ts src/pages/builder/predicted-drop-hover.ts
git commit -m "feat: restore builder v2 card drag hover parity"
```

### Task 5: Restore Shared Non-Mobile Interaction Parity

**Files:**
- Create: `src/pages/builder/v2/useBuilderV2SelectionDismiss.ts`
- Create: `src/pages/builder/v2/BuilderV2Selection.test.tsx`
- Create: `src/pages/builder/v2/BuilderV2QuickLineup.test.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.tsx`
- Modify: `src/pages/builder/v2/BuilderTeamStage.tsx`
- Modify: `src/pages/builder/v2/useBuilderV2Actions.ts`
- Modify: `src/pages/builder/v2/BuilderPickerPanel.tsx`

**Step 1: Write the failing test**

- Add regression tests that cover:
  - outside-click selection dismissal for non-mobile V2
  - quick-lineup step progression/backtracking/cancel/finish in the shared non-mobile stage
  - picker completion callbacks continuing to advance quick-lineup correctly
  - transfer dialog flow remaining intact after the new tablet/shared-stage wiring
  - type-to-search autofocus parity for non-mobile V2
  - touch-mode fallback behavior remaining usable if drag is disabled or softened on tablet

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Selection.test.tsx src/pages/builder/v2/BuilderV2QuickLineup.test.tsx`
Expected: FAIL because the current non-mobile V2 flow does not fully surface these interactions.

**Step 3: Write minimal implementation**

- Port selection-dismiss behavior into a V2-local hook that respects quick-lineup state.
- Ensure the shared non-mobile stage uses the existing quick-lineup store slice and the existing picker action-completion hooks instead of duplicating control flow.
- Keep dialogs/toasts/import/export/reset flowing through the same `useBuilderV2Actions` boundary.
- Port V1-style global type-to-search capture into non-mobile V2 once the picker search input ref exists.
- Add a bounded tablet touch DnD pass here or in the tablet shell pass:
  - first try low-churn mitigations
  - if reliability still feels poor, prefer an intentional fallback strategy over a fragile drag experience

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Selection.test.tsx src/pages/builder/v2/BuilderV2QuickLineup.test.tsx src/pages/builder/v2/BuilderPickerPanel.test.tsx src/pages/builder/v2/useBuilderV2Actions.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/useBuilderV2SelectionDismiss.ts src/pages/builder/v2/BuilderV2Selection.test.tsx src/pages/builder/v2/BuilderV2QuickLineup.test.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/BuilderTeamStage.tsx src/pages/builder/v2/useBuilderV2Actions.ts src/pages/builder/v2/BuilderPickerPanel.tsx
git commit -m "feat: restore shared builder v2 interaction parity"
```

### Task 6: Ship Desktop As A Layout Follow-On

**Files:**
- Modify: `src/pages/builder/v2/BuilderDesktopLayout.tsx`
- Modify: `src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.tsx`
- Modify: `src/pages/builder/v2/useStickyMaxHeight.ts`

**Step 1: Write the failing test**

- Add desktop-specific tests that assert:
  - desktop reuses the shared non-mobile team stage
  - picker renders in the right side rail with sticky height behavior
  - the builder stage remains fixed at 4x1 across desktop widths
  - teams panel remains visible without collapsing the active builder stage

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
Expected: FAIL until the desktop shell is aligned with the shared stage and requested picker placement.

**Step 3: Write minimal implementation**

- Rework `BuilderDesktopLayout.tsx` to reuse the shared non-mobile stage and keep the picker in a sticky side rail.
- Keep desktop picker-right to match V1.
- Keep the desktop stage visually roomier than tablet, but do not fork the core interaction/state flow.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderDesktopLayout.test.tsx src/pages/builder/v2/BuilderV2Page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderDesktopLayout.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/useStickyMaxHeight.ts
git commit -m "feat: complete builder v2 desktop layout"
```

### Task 7: Final Verification And Parity Sweep

**Files:**
- Modify: `src/pages/builder/v2/BuilderV2Page.test.tsx`
- Modify: `src/pages/builder/v2/BuilderTabletLayout.test.tsx`
- Modify: `src/pages/builder/v2/BuilderDesktopLayout.test.tsx`
- Modify: `src/pages/builder/v2/BuilderCardGrid.test.tsx`
- Modify: `src/pages/builder/v2/BuilderV2QuickLineup.test.tsx`

**Step 1: Write the failing test**

- Add/adjust any final regressions discovered during tablet/desktop integration:
  - tabs + quick-lineup + picker interop
  - builder-card DnD hover state
  - transfer-dialog survival
  - tablet compact-width guardrails
  - desktop sticky picker behavior
  - non-mobile type-to-search autofocus behavior
  - tablet touch interaction fallback or mitigation behavior

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/BuilderTabletLayout.test.tsx src/pages/builder/v2/BuilderDesktopLayout.test.tsx src/pages/builder/v2/BuilderCardGrid.test.tsx src/pages/builder/v2/BuilderV2QuickLineup.test.tsx`
Expected: FAIL only where the last regression gaps still exist.

**Step 3: Write minimal implementation**

- Close the remaining integration gaps without broadening scope.
- Decide whether any deferred parity items, especially teams-panel preview-slot DnD or deeper tablet touch drag work, must be pulled into this bundle or explicitly deferred in notes/PR summary.

**Step 4: Run tests to verify it passes**

Run: `npm run lint`
Expected: PASS

Run: `npm run test:integration`
Expected: PASS

Run: `npm run verify`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2
git commit -m "test: verify builder v2 tablet and desktop parity"
```

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
