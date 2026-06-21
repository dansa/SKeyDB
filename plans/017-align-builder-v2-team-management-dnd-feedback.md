# Plan 017: Align Builder V2 Team-Management DnD Feedback

## Summary

Active-team slots already display predicted/effective drop state, so nested
wheel and covenant targets can stay highlighted even when DnDKit reports the
parent slot as the current geometric collision. Team-management rows are less
consistent: the parent slot uses `predictedDropTarget`, while the nested covenant
and wheel controls use raw `isOver`. That means visual feedback can disagree
with the action resolver, especially after plan 016 makes target arbitration more
semantic.

This plan makes team-management slot, wheel, and covenant feedback read from the
same effective target contract.

## Audit Evidence

- `src/features/builder-v2/BuilderV2TeamSlots.tsx` computes active-team
  `isPredictedSlotDropTarget`, `isPredictedCovenantDropTarget`, and
  `isPredictedWheelDropTarget` from `predictedDropTarget`.
- `src/features/builder-v2/BuilderV2TeamManagement.tsx` computes
  `isPredictedTeamManagementSlotDropTarget` for parent slots, but
  `TeamSlotCovenantButton` and `WheelMiniSummary` apply drop-target classes from
  raw DnDKit `isOver`.
- `src/features/builder-v2/useBuilderV2Dnd.ts` already publishes
  `activeDropTarget`, which is the UI-level effective target after parsing and
  target resolution.
- `src/features/builder-v2/builder-v2-team-management.css` has distinct
  drop-target selectors for parent slots, covenant buttons, and wheel chips, so
  this can be fixed without introducing new visual vocabulary.

## DnDKit References

- Legacy `DndContext` docs: `onDragOver` receives the current `over` target, but
  apps can derive their own state from that signal.
- Legacy collision docs: mixed targets often require custom collision routing;
  UI feedback should follow the routed target, not an incidental raw collision.
- Drag overlay docs: overlays and original elements should communicate drag
  state without remounting the overlay or making visual feedback depend on the
  dragged element itself.

Official docs reviewed:

- https://dndkit.com/legacy/api-documentation/context-provider/dnd-context
- https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms
- https://dndkit.com/legacy/api-documentation/draggable/drag-overlay

## Scope

In scope:

- `src/features/builder-v2/BuilderV2TeamManagement.tsx`
- `src/features/builder-v2/builder-v2-team-management.css` only if existing
  selectors need tiny adjustment.
- Focused tests in `src/features/builder-v2/BuilderV2Page.test.tsx` or a
  narrower component test if one exists.

Out of scope:

- Collision filtering and target ranking; covered by plan 016.
- Browser smoke expansion; covered by plan 018.
- Redesigning the team-management row layout.

## Steps

1. Thread effective drag state into nested controls.
   - Pass `isDragActive` and `predictedDropTarget` from `TeamSlotSummary` into
     the covenant and wheel summary controls.
   - Keep raw `isOver` available only as a fallback if a control still needs it
     for a DnDKit edge case.

2. Add explicit predicted-target helpers.
   - Add a covenant helper that matches
     `kind === 'team-management-covenant'`, `teamId`, and `slotId`.
   - Add a wheel helper that matches `kind === 'team-management-wheel'`,
     `teamId`, `slotId`, and `wheelIndex`.
   - Keep the parent slot helper responsible for broad
     `team-management-slot` targets.

3. Normalize class application.
   - Parent slot: highlight broad slot acceptance.
   - Covenant button: highlight only when the effective target is the covenant
     target for that slot.
   - Wheel chip: highlight only when the effective target is the matching wheel
     index.
   - Avoid adding duplicate classes that make parent and child appear equally
     active when only one action will run.

4. Add tests around rendered feedback.
   - Render a team-management row with a drag-active state and a covenant target;
     assert the covenant class is present and unrelated wheel classes are absent.
   - Render a wheel target; assert only the matching wheel chip is highlighted.
   - Render a broad slot target; assert the parent slot is highlighted while
     child-specific controls are not falsely highlighted.

5. Manually verify in browser after plan 016 lands.
   - Drag a wheel across teams in desktop layout.
   - Drag a covenant across teams in desktop layout.
   - Repeat at the adaptive/tablet viewport used by
     `verify-builder-v2-browser`.

## STOP Conditions

- Stop if the component needs to duplicate resolver rules beyond simple target
  identity checks. That means the resolver/collision contract is still too fuzzy
  and plan 016 should be revisited.
- Stop if a CSS change creates a new visual token or palette. This plan should
  reuse the existing Builder V2 DnD drop-target styles.

## Verification

Run at minimum:

- `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npm run verify:builder-v2:browser`

## Done Criteria

- Team-management parent slot, covenant, and wheel drop styling all follow
  `activeDropTarget` / `predictedDropTarget`.
- The UI highlights the target that will actually receive the drop.
- Existing active-team DnD feedback remains unchanged.
- Desktop and adaptive browser checks show stable overlay and drop-zone styling.
