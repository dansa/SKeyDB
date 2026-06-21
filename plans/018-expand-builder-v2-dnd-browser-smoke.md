# Plan 018: Expand Builder V2 DnD Browser Smoke Coverage

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report; do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and told you they maintain
> the index.
>
> **Drift check (run first)**:
> `git diff --stat 81320e7d..HEAD -- scripts/verify-builder-v2-browser.mjs src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/BuilderV2TeamManagement.tsx src/features/builder-v2/BuilderV2TeamSlots.tsx`
> If any in-scope file changed since this plan was written, compare the audit
> evidence below against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW-MED
- **Depends on**: plans/016-normalize-builder-v2-dnd-collision-arbitration.md, plans/017-align-builder-v2-team-management-dnd-feedback.md
- **Category**: tests
- **Planned at**: commit `81320e7d`, 2026-06-21

## Summary

`scripts/verify-builder-v2-browser.mjs` is the right end-to-end gate for Builder
V2 responsive behavior, but its current DnD smoke is narrow: it drags one picker
awakener into the active team and asserts only that text changed. It does not
prove that overlays render, drop-zone classes appear while dragging, nested
wheel/covenant targets are reachable, or team-management list targets behave at
desktop/adaptive widths.

This plan turns the smoke into a small DnD semantics proof without making it a
full interaction suite.

Refresh note: plans 016 and 017 have landed. Collision arbitration is now
semantic, and team-management rendered feedback tests cover parent slot,
covenant, and wheel classes. The remaining gap is browser-level proof that those
visible DnD states appear during real pointer drags.

## Audit Evidence

- `scripts/verify-builder-v2-browser.mjs` runs desktop, adaptive, and mobile
  viewports, but `runPointerDndSmoke` only executes for non-mobile layouts.
- The current DnD smoke drags a picker awakener to an active-team empty slot and
  checks `.builder-v2-active-team` text.
- There are no browser assertions for `BuilderV2DragOverlay`, active drop-zone
  styling, team-management slots, or nested wheel/covenant targets.
- `src/features/builder-v2/BuilderV2Page.test.tsx` now covers rendered
  team-management drop-target classes from plan 017, but those are component
  assertions rather than live browser pointer-drag assertions.
- `src/features/builder-v2/BuilderV2Page.test.tsx` verifies that touch/mobile
  devices do not advertise pointer-only drag affordances, so browser smoke should
  continue to treat mobile as click/tap driven.

## DnDKit References

- Legacy DragOverlay docs: the overlay should remain mounted and its children
  should be conditionally rendered; overlays are especially important for
  cross-container and scroll-container dragging.
- Legacy sensors docs: custom sensors are passed through `DndContext`; this repo
  uses a pointer sensor with a small activation distance for V2.
- Legacy accessibility docs: draggable handles need clear labels/instructions
  when keyboard drag is exposed. V2 currently avoids exposing DnDKit keyboard
  semantics and relies on click-first alternatives.

Official docs reviewed:

- https://dndkit.com/legacy/api-documentation/draggable/drag-overlay
- https://dndkit.com/legacy/api-documentation/sensors
- https://dndkit.com/legacy/guides/accessibility

## Scope

In scope:

- `scripts/verify-builder-v2-browser.mjs`
- Optional tiny test-only selectors if existing labels/classes are too unstable,
  but prefer current semantic labels and class names first.

Out of scope:

- Production DnD behavior changes.
- Full Playwright test-suite conversion.
- Mobile pointer DnD enablement.

## Dependencies

- Plan 016 should land first so team-management cross-container targets are
  semantically stable.
- Plan 017 should land before finalizing class assertions for nested
  team-management wheel/covenant feedback.

## Steps

1. Add reusable smoke helpers.
   - A drag helper that moves from source center to target center in multiple
     steps and can pause at the midpoint.
   - A helper that asserts a selector/class appears while the pointer is held
     down, before mouse up.
   - A helper that asserts the drag overlay is visible during pointer drag and
     gone or empty after drop.

2. Keep the existing active-team awakener assignment smoke.
   - Preserve the current mutation assertion so the script still proves a real
     drop occurred.
   - Add a during-drag assertion for the active slot drop-target class.

3. Add one nested active-team equipment smoke.
   - Use deterministic UI setup to make a wheel or covenant picker item
     draggable.
   - Drag it over the corresponding active-team nested target.
   - Assert the nested target class appears while dragging and the active-team
     summary mutates after drop.

4. Add a team-management target smoke for desktop/adaptive.
   - Use UI flows or deterministic in-browser setup already accepted by the
     smoke script to create a second team.
   - Drag a picker item or an existing team-management wheel/covenant onto a
     team-management slot/child target.
   - Assert the team-management drop-target class appears during drag.
   - Assert the target team row mutates after drop.

5. Preserve mobile expectations.
   - Mobile should still skip pointer DnD.
   - Mobile should continue proving the click/tap assignment path where the
     existing script already checks it.

6. Add failure diagnostics.
   - On DnD smoke failure, capture a screenshot path and include source/target
     bounding boxes in the thrown error.
   - Keep console output concise enough for CI logs.

## STOP Conditions

- Stop if the script becomes dependent on arbitrary sleeps longer than the
  current interaction timing pattern. Prefer DOM state waits and bounding-box
  checks.
- Stop if a selector has to reach deep into generated DnDKit internals. Add or
  reuse app-level labels/classes instead.
- Stop if the smoke starts mutating persisted user data outside its browser
  context.

## Verification

Run at minimum:

- `npm run verify:builder-v2:browser`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`

If helper changes are non-trivial, also run:

- `npm run test:integration:builder-v2`
- `npm run build:quiet`

## Done Criteria

- Desktop and adaptive browser smoke prove at least one active-team DnD drop and
  one team-management DnD drop.
- Smoke asserts overlay visibility and visible drop-zone styling during drag.
- Mobile smoke remains click/tap based and does not require pointer DnD.
- Failure output tells the next engineer which source, target, and viewport
  failed.
