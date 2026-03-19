# Builder V2 Review Follow-Ups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the current Builder V2 review findings that affect correctness, shared layout contracts, and maintainability across mobile and tablet.

**Architecture:** Keep fixes inside `src/pages/builder/v2/*` unless a shared legacy helper already owns the relevant behavior. Preserve the current tablet/mobile shell direction, but tighten ownership by making edit sessions stable, restoring toolbar behavior parity, fixing layout measurement correctness, and aligning tests with the intended tablet height contract.

**Tech Stack:** React, TypeScript, Zustand, Vitest, Testing Library, Tailwind CSS

---

**Status:** Done

**Last updated:** 2026-03-19

**Related docs:**
- Notes: `docs/notes/builder-v1-audit.md`
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`

## Scope

- Fix rename-session correctness in the V2 teams panel and active-team header.
- Restore tablet toolbar button guard semantics without reworking desktop placeholder flow.
- Fix shared measured-size hook behavior when an observed region collapses to zero.
- Remove the transient invalid first paint from mobile quick lineup.
- Update tablet height-budget tests to match the intentional `730px` picker-priority band.
- Move core element defaults into the proper CSS base layer so Tailwind utilities can override them when asked.
- Pick off small follow-up cleanup items from the same review pass when they are cheap and well-bounded.

## Out of Scope

- Desktop layout completion or desktop placeholder cleanup.
- Large visual redesigns of Builder V2 chrome.
- New interaction features beyond the review findings already identified.

## Risks / Watchpoints

- Rename fixes must not break current inline-editor flows in either the list or header surfaces.
- Toolbar parity should preserve tablet visuals while restoring disabled-state semantics.
- Layout-hook changes affect both mobile and tablet measured sizing, so tests need to pin the intended zero-size behavior.
- Mobile quick-lineup startup changes must not break cancel/finish/advance flows already covered by integration tests.
- The CSS layering fix should preserve the existing default paragraph behavior while letting explicit Tailwind text-wrap utilities win.

## Progress Snapshot

- Done:
  - Reviewed and prioritized the current Builder V2 findings.
  - Stabilized rename sessions in the V2 teams panel and active-team header.
  - Restored tablet toolbar disabled-state guard parity.
  - Removed the transient invalid first paint from mobile quick lineup.
  - Updated the tablet card-scale expectations to the intentional `730px` band.
  - Moved core element defaults in `src/index.css` into `@layer base` so Tailwind utilities can override them.
  - Gave the mobile picker drawer scrim an unconditional accessible close name.
  - Removed the unused tablet `compactLayout` prop handoff from `BuilderTeamStage`.
  - Moved shared layout hooks into `src/pages/builder/v2/layout-hooks.ts` and updated callers so V2 code no longer imports measurement/snap helpers from a misleading mobile-only path.
  - Promoted the shared import/export/reset action bar to `src/pages/builder/v2/BuilderWideBar.tsx`, removed the `MobileCurrentTeamBar` passthrough, and deleted the orphaned `BuilderMobileLayout.tsx` shell.
  - Extracted the repeated layout-switcher banner in `BuilderV2Page` and consolidated the duplicated mobile/tablet dialog-toast chrome there.
  - Promoted `layout-math` and `quick-lineup-model` to shared V2 primitives and updated callers so tablet and shared stage code no longer import those helpers from `mobile/`.
  - Removed the temporary re-export shims after updating the remaining callers, so shared V2 helpers now resolve directly from their owned paths.
  - Narrowed `BuilderV2Toolbar` back down to toolbar ownership only and moved shared dialog/toast chrome to `BuilderV2Page` for every layout, including the desktop placeholder path.
  - Removed the dead `shellMode` pass-through from `MobileBuilderScreen` and its callers so preview/device ownership stays in `MobileLayout`.
  - Restored the shared wide-bar export guard contract on mobile and added a direct `BuilderWideBar` regression for the no-team / no-active-team states.
  - Extracted a shared wide-bar prop adapter so desktop, tablet, and mobile stop hand-wiring the same import/export/reset action contract in parallel.
  - Fixed the unstable `selectActiveTeamSlots` fallback so missing active-team states no longer allocate a fresh empty array and loop subscribers.
  - Renamed the shared page-snap hooks to builder-neutral names so tablet no longer imports behavior that is conceptually labeled as mobile-only.
  - Decoupled `MobilePickerDrawer` from `returnSlotIndex` so it resolves slot identity from `context.slotId`, and updated the focused-underlay path to do the same.
  - Promoted the remaining page-snap and view-transition internals to builder-neutral module names and removed the unused `className` escape hatch from `BuilderToolbarShell`.
  - Repaired the new/updated test files so they pass `npm run verify` cleanly.
  - Re-anchored the mobile picker drawer to the builder content frame so utility/layout override chrome no longer gets counted inside the picker overlay height budget.
  - Standardized the named mobile/tablet builder hover states across the shared top toolbar, team action bars, quick-lineup controls, picker tabs/chips/collapser, picker sort select, and the mobile overview/focused/quick-lineup card surfaces.
  - Routed current-team resets through the shared confirm-dialog stack so mobile/tablet current-team reset buttons now confirm before clearing populated teams.
  - Stopped the shared page-snap hook from reacting to load-time scroll noise, so mobile/tablet no longer auto-snap on initial entry.
  - Blurred the layout override switcher before changing modes to avoid focus-preservation scroll jumps when entering the mobile shell from the layout selector.
- Done:
  - Confirmed the reported zero-size measurement issue was not reproducible in the current shared hook path, so no speculative production churn shipped there.
- Next:
  - Hand remaining folder-ownership decisions, including any future `/tablet` split, to the post-desktop builder pass.
- Blockers:
  - None.

## Verification

- `npm exec vitest run src/pages/builder/v2/BuilderTeamsPanel.test.tsx src/pages/builder/v2/BuilderV2ActiveTeamHeader.test.tsx`
- `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/layout-hooks.test.tsx src/pages/builder/v2/mobile/MobileLayout.test.tsx`
- `npm exec vitest run src/pages/builder/v2/LayoutModeSwitcher.test.tsx src/pages/builder/v2/useBuilderV2Actions.test.tsx src/pages/builder/v2/BuilderV2Page.test.tsx src/pages/builder/v2/mobile/MobileLayout.test.tsx src/pages/builder/v2/mobile/MobileQuickLineup.test.tsx src/pages/builder/v2/BuilderTeamStage.test.tsx`
- `npm exec vitest run src/pages/builder/v2/mobile/MobileLayout.test.tsx src/pages/builder/v2/BuilderWideBar.test.tsx src/pages/builder/v2/BuilderPickerPanel.test.tsx src/pages/builder/v2/TeamTabs.test.tsx src/pages/builder/v2/mobile/focused-card/FocusedShared.test.tsx src/pages/builder/v2/mobile/focused-card/FocusedLoadout.test.tsx src/pages/builder/v2/mobile/quick-lineup/QuickLineupSlotCard.test.tsx`
- `npm exec vitest run src/pages/builder/v2/tablet-card-scale.test.ts`
- `npm run lint`
- `npm run test:integration`
- `npm run verify`

### Task 1: Fix Stable Rename Ownership

**Files:**
- Modify: `src/pages/builder/v2/BuilderTeamsPanel.tsx`
- Modify: `src/pages/builder/v2/BuilderV2ActiveTeamHeader.tsx`
- Modify: `src/pages/builder/v2/BuilderTeamsPanel.test.tsx`
- Modify: `src/pages/builder/v2/BuilderV2ActiveTeamHeader.test.tsx`

**Step 1: Write the failing test**

- Add a teams-panel regression that starts renaming Team 1, switches active team, commits, and asserts Team 1 receives the draft while Team 2 stays unchanged.
- Add a header regression that starts a rename, switches active team, commits, and asserts the original team receives the draft.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTeamsPanel.test.tsx src/pages/builder/v2/BuilderV2ActiveTeamHeader.test.tsx`
Expected: FAIL because both surfaces currently commit against the current active team.

**Step 3: Write minimal implementation**

- Capture a stable editing team id when rename begins in each surface.
- Commit and cancel against that captured id instead of `activeTeamId`.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderTeamsPanel.test.tsx src/pages/builder/v2/BuilderV2ActiveTeamHeader.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderTeamsPanel.tsx src/pages/builder/v2/BuilderV2ActiveTeamHeader.tsx src/pages/builder/v2/BuilderTeamsPanel.test.tsx src/pages/builder/v2/BuilderV2ActiveTeamHeader.test.tsx
git commit -m "fix: stabilize builder v2 rename sessions"
```

### Task 2: Restore Tablet Toolbar Guard Parity

**Files:**
- Create: `src/pages/builder/v2/BuilderWideBar.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.tsx`
- Modify: `src/pages/builder/v2/BuilderV2Page.test.tsx`

**Step 1: Write the failing test**

- Extend the tablet page test so a tablet render with no teams and no active team asserts `Export All` and `Export In-Game` are disabled.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx`
Expected: FAIL because the current tablet toolbar buttons remain enabled.

**Step 3: Write minimal implementation**

- Thread `hasTeams` and `hasActiveTeam` into the shared mobile/tablet toolbar bar.
- Keep current tablet visuals, but restore the old disabled-state contract.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/BuilderV2Page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/BuilderWideBar.tsx src/pages/builder/v2/BuilderV2Page.tsx src/pages/builder/v2/BuilderV2Page.test.tsx
git commit -m "fix: restore tablet builder toolbar guards"
```

### Task 3: Fix Shared Zero-Size Measurement Behavior

**Files:**
- Modify: `src/pages/builder/v2/layout-hooks.ts`
- Modify: `src/pages/builder/v2/layout-hooks.test.tsx`
- Modify: `src/pages/builder/v2/mobile/layout-hooks.ts`

**Step 1: Write the failing test**

- Add a measurement regression that reports a nonzero element size, then collapses the element to `0x0`, and asserts the hook publishes zero instead of keeping stale dimensions.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/layout-hooks.test.tsx`
Expected: FAIL because the current hook never publishes zero.

**Step 3: Write minimal implementation**

- Remove the nonzero-only guard so the measured size state always reflects the latest observed bounds.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/layout-hooks.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/layout-hooks.ts src/pages/builder/v2/layout-hooks.test.tsx src/pages/builder/v2/mobile/layout-hooks.ts
git commit -m "fix: publish zero-sized builder layout measurements"
```

### Task 4: Remove Mobile Quick-Lineup Invalid First Paint

**Files:**
- Modify: `src/pages/builder/v2/mobile/MobileQuickLineup.tsx`
- Modify: `src/pages/builder/v2/mobile/MobileLayout.test.tsx`

**Step 1: Write the failing test**

- Add a quick-lineup regression that opens quick lineup and asserts the shell never renders `Step 1 / 0`.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/mobile/MobileLayout.test.tsx`
Expected: FAIL because the session is created after the shell first renders.

**Step 3: Write minimal implementation**

- Gate or initialize the quick-lineup view so it does not render the interactive shell before session state exists.
- Keep the current start/cancel/finish flow intact.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/mobile/MobileLayout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/mobile/MobileQuickLineup.tsx src/pages/builder/v2/mobile/MobileLayout.test.tsx
git commit -m "fix: avoid invalid first paint in mobile quick lineup"
```

### Task 5: Align Tablet Height Tests With The Intended 730px Band

**Files:**
- Modify: `src/pages/builder/v2/tablet-card-scale.test.ts`

**Step 1: Write the failing test**

- Update the two stale expectations so the test documents the intentional 730px picker-priority band rather than the superseded 750px behavior.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/pages/builder/v2/tablet-card-scale.test.ts`
Expected: FAIL against the old expectations, then pass once the new expectations are in place.

**Step 3: Write minimal implementation**

- Patch test expectations only. Do not change `tablet-layout-metrics.ts`.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/pages/builder/v2/tablet-card-scale.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/pages/builder/v2/tablet-card-scale.test.ts
git commit -m "test: align tablet builder scale expectations"
```

### Task 6: Fix CSS Base-Layer Precedence And Small Follow-Ups

**Files:**
- Modify: `src/index.css`
- Create: `src/index.css.test.ts`
- Modify: `src/pages/builder/v2/mobile/MobilePickerDrawer.tsx`
- Modify: `src/pages/builder/v2/mobile/MobileLayout.test.tsx`
- Modify: `src/pages/builder/v2/BuilderTeamStage.tsx`

**Step 1: Write the failing test**

- Add a source-level CSS regression that asserts the core element defaults, including `p { text-wrap: pretty; }`, live inside an explicit base layer instead of as unlayered rules.
- Add a mobile picker regression that opens the drawer and asserts the large scrim close button has an accessible name.

**Step 2: Run test to verify it fails**

Run: `npm exec vitest run src/index.css.test.ts src/pages/builder/v2/mobile/MobileLayout.test.tsx`
Expected: FAIL because the `p` rule is unlayered and the scrim button is unnamed when a card preview exists.

**Step 3: Write minimal implementation**

- Wrap the core element defaults in `@layer base` inside `src/index.css`.
- Give the picker scrim button an unconditional accessible name.
- Remove the unused tablet `compactLayout` prop handoff from `BuilderTeamStage` while touching this cleanup layer.

**Step 4: Run tests to verify it passes**

Run: `npm exec vitest run src/index.css.test.ts src/pages/builder/v2/mobile/MobileLayout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/index.css src/index.css.test.ts src/pages/builder/v2/mobile/MobilePickerDrawer.tsx src/pages/builder/v2/mobile/MobileLayout.test.tsx src/pages/builder/v2/BuilderTeamStage.tsx docs/plans/2026-03-19-builder-v2-review-followups.md
git commit -m "fix: restore css base layer precedence"
```

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
