# Plan 016: Normalize Builder V2 DnD Collision Arbitration

## Summary

Builder V2 has a strong pure DnD action resolver, but its live DnDKit collision
arbitration still lets unrelated droppable IDs compete with loadout targets. The
highest-impact example is the team-management list: sortable team rows are valid
DnDKit droppables for team reordering, and non-team loadout drags currently run
`pointerWithin` / `closestCenter` against every registered droppable. A wheel
dragged across teams can therefore land on the bare team-row sortable ID instead
of a nested `team-management-wheel` or `team-management-slot` target, producing
an unparseable `over.id` and a no-op.

This plan makes `createBuilderV2CollisionDetection` source-aware: team-sort
payloads see sortable team-row targets, while loadout payloads see only semantic
Builder V2 drop targets and prefer the most specific nested target that the
resolver can use.

## Audit Evidence

- `src/features/builder-v2/useBuilderV2Dnd.ts` filters droppables only for
  `team-sort` payloads. Non-team drags call `pointerWithin(args)` and then
  `closestCenter(args)` with all droppables.
- `src/features/builder-v2/BuilderV2TeamManagement.tsx` registers bare team IDs
  through `SortableContext` / `useSortable` and also registers nested
  `team-management-slot`, `team-management-covenant`, and
  `team-management-wheel` droppables.
- `src/features/builder-v2/useBuilderV2Dnd.ts` parses `event.over?.id` through
  `parseBuilderV2DropTargetId`; bare team-row IDs intentionally do not parse as
  loadout targets.
- `src/features/builder-v2/builder-v2-dnd.test.ts` covers team-sort filtering,
  but does not cover the inverse rule that loadout drags must ignore sortable
  row IDs.
- User report: in the teams list DnD experience, a wheel can be dragged inside a
  team but not cross-team, and the overall experience feels difficult.

## DnDKit References

Use the installed legacy API family, not the newer `@dnd-kit/react` examples:

- Installed packages: `@dnd-kit/core@6.3.1`,
  `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`.
- Legacy `DndContext` docs: collision detection is supplied at the context
  boundary and affects the `over` target delivered to handlers.
- Legacy collision docs: custom collision algorithms can compose built-ins and
  route different target classes through different algorithms.
- Legacy sortable overview: sortable collections commonly use
  `closestCenter`, but sortable item IDs are still regular droppable IDs inside
  the same context.
- Current collision guide principle: nested containers and mixed target kinds
  need explicit collision behavior instead of relying on one generic geometric
  rule.

Official docs reviewed:

- https://dndkit.com/legacy/api-documentation/context-provider/dnd-context
- https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms
- https://dndkit.com/legacy/presets/sortable/overview
- https://dndkit.com/react/guides/collision-detection

## Scope

In scope:

- `src/features/builder-v2/useBuilderV2Dnd.ts`
- `src/features/builder-v2/builder-v2-dnd.ts` only if existing parse/type helpers
  need a tiny exported helper for collision classification.
- `src/features/builder-v2/builder-v2-dnd.test.ts`
- Focused React tests only if a collision behavior cannot be characterized at
  the pure helper level.

Out of scope:

- CSS or visual drop-state changes; covered by plan 017.
- Browser smoke expansion; covered by plan 018.
- Mobile DnD enablement.
- Adding `KeyboardSensor`; that is a separate product/a11y decision because V2
  currently exposes click-first non-pointer alternatives and deliberately does
  not advertise pointer-only DnD as keyboard-draggable.

## Steps

1. Characterize the current collision behavior with failing tests.
   - Add a test where the droppable set contains a sortable team-row ID and a
     nested `team-management-wheel` or `team-management-slot` ID for a wheel
     payload.
   - Add a test where active-team nested slot/covenant/wheel IDs compete and the
     more specific valid target wins for the payload kind.
   - Add a test proving `team-sort` payloads still ignore loadout droppables and
     use sortable row IDs only.

2. Add semantic droppable filtering for loadout payloads.
   - Reuse `parseBuilderV2DropTargetId` as the boundary for loadout droppables.
   - Exclude bare team-sort IDs from non-team payload collision candidates.
   - Keep the picker/remove target available for removable team and
     team-management payloads.

3. Add specificity ordering for nested semantic targets.
   - Prefer explicit wheel targets for wheel payloads when present.
   - Prefer explicit covenant targets for covenant payloads when present.
   - Prefer slot targets for awakener/slot payloads, and allow wheel/covenant
     targets to resolve to their parent slot only through the existing resolver.
   - Keep `resolveBuilderV2DndAction` as the source of truth for whether a
     collision is actionable. The collision layer should choose candidates, not
     duplicate assignment rules.

4. Keep the DnDKit algorithm composition transparent.
   - Run `pointerWithin` first for pointer precision.
   - Fall back to `closestCenter` on the same source-aware candidate set.
   - Reorder/filter the resulting collisions only enough to express Builder V2
     target semantics.

5. Update tests to lock the rule table.
   - Team sort: sortable row IDs only.
   - Loadout drags: semantic Builder V2 drop target IDs only.
   - Team-management wheel cross-team: row ID present in the registry cannot
     steal the collision from a nested wheel/slot target.
   - Picker remove: still reachable for supported source payloads.

## STOP Conditions

- Stop if the implementation requires fabricating DnDKit `Collision` objects
  without enough metadata to preserve stable ordering. Prefer filtering/reordering
  collisions returned by DnDKit built-ins.
- Stop if a test shows the resolver and collision layer disagree on what target
  should be actionable; fix the resolver first or split a new plan.
- Stop if the change alters mobile behavior. Mobile DnD is disabled by device
  capability and should remain click/tap driven.

## Verification

Run at minimum:

- `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run`
- `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`

Also run `npm run verify:builder-v2:browser` before merging if plan 017 or 018
has already landed in the branch.

## Done Criteria

- Non-team Builder V2 drags cannot collide with sortable team-row IDs.
- Team sorting still works through sortable row IDs.
- Cross-team wheel/covenant team-management drops resolve to semantic nested or
  slot targets instead of no-op row targets.
- Collision tests document the payload-to-target matrix clearly enough that a
  future DnD source can be added without guessing.
