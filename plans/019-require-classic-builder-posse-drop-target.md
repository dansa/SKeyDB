# Plan 019: Require Classic Builder Posse Drops To Hit A Declared Target

## Disposition

Rejected/deferred after product clarification on 2026-06-21: Builder V1/classic
Builder does not need DnD adjustment unless something is breaking, and it is due
to be retired once Builder V2 catches up. Keep this file as audit evidence, but
do not execute it as an active plan.

## Summary

The classic Builder still uses DnDKit. Most classic drag payloads check the
target ID before dispatching, but `picker-posse` drops call `onDropPickerPosse`
for any string `over.id`. The current unit test even locks this behavior with an
`any-target` drop. That makes classic DnD semantics weaker than Builder V2 and
can hide accidental target collisions.

This plan either gives classic posse assignment an explicit droppable target or
removes the misleading pointer-drag affordance for posse items if the product
intent is global click assignment rather than target assignment.

## Audit Evidence

- `src/features/builder/useBuilderDnd.ts` handles `picker-posse` by calling
  `onDropPickerPosse(data.posseId)` without checking `over.id`.
- `src/features/builder/useBuilderDnd.test.ts` expects a `picker-posse` dropped
  over `any-target` to assign.
- `src/features/builder/dnd-ids.ts` declares picker, wheel, covenant, and
  team-preview slot drop IDs, but no posse-specific drop ID.
- Builder V2's `builder-v2-dnd.ts` resolver accepts posse drops only when the
  target kind is `posse`.

## DnDKit References

- Legacy `DndContext` docs: all drag-end behavior flows through the `over`
  target produced by the DnD context.
- Legacy collision docs: custom or mixed target behavior should be explicit, so
  unrelated droppable surfaces do not trigger unrelated actions.
- Legacy accessibility docs: if a draggable affordance is exposed, its target and
  result should be understandable to users.

Official docs reviewed:

- https://dndkit.com/legacy/api-documentation/context-provider/dnd-context
- https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms
- https://dndkit.com/legacy/guides/accessibility

## Scope

In scope:

- `src/features/builder/useBuilderDnd.ts`
- `src/features/builder/useBuilderDnd.test.ts`
- `src/features/builder/dnd-ids.ts`
- The classic Builder component that renders the posse target, if an explicit
  target is added.

Out of scope:

- Builder V2 DnD behavior.
- A broad classic Builder DnD refactor.
- Keyboard DnD parity.

## Decision Point

Before implementing, confirm the intended classic posse interaction from the UI:

- If posse assignment is target-specific, add a named posse drop-zone ID and
  require `over.id` to match it before calling `onDropPickerPosse`.
- If posse assignment is intentionally global, stop exposing a misleading drag
  path for `picker-posse` and keep the click path as the primary interaction.

Do not keep the current middle ground where any droppable target assigns posse.

## Steps

1. Update tests first.
   - Replace the `any-target` expectation with a negative test.
   - Add a positive test for the declared posse target if the drag path remains.
   - Add a no-op test for dropping posse over wheel/covenant/team slot targets.

2. Add or reuse an explicit target.
   - If keeping drag, add a `POSSE_DROP_ZONE_ID` or typed helper in
     `dnd-ids.ts`.
   - Register the corresponding `useDroppable` in the classic Builder posse
     target component.
   - Apply existing visual target styling; do not invent new theme tokens.

3. Tighten `useBuilderDnd`.
   - For `picker-posse`, call `onDropPickerPosse` only when `over.id` is the
     declared posse target.
   - Otherwise return without side effects.

4. Smoke the classic path.
   - Verify click assignment still works.
   - Verify drag assignment works only on the declared target if drag remains.
   - Verify wheel/covenant/slot DnD still works.

## STOP Conditions

- Stop if there is no clear classic posse target in the UI and no product signal
  that drag is still desired. In that case, write a tiny follow-up note in this
  plan and remove the drag affordance in a separate explicit implementation
  plan.
- Stop if a fix requires importing Builder V2 DnD primitives into classic
  Builder. Keep the surfaces separate.

## Verification

Run at minimum:

- `npx vitest run src/features/builder/useBuilderDnd.test.ts --run`
- `npm run test:integration:builder`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`

## Done Criteria

- `picker-posse` drops no longer assign over arbitrary droppable IDs.
- Tests document the intended posse target behavior.
- Classic Builder wheel, covenant, slot, and team preview DnD behavior remains
  unchanged.
