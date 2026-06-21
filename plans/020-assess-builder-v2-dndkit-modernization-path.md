# Plan 020: Assess Builder V2 DnDKit Modernization Path

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report; do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and told you they maintain
> the index.
>
> **Drift check (run first)**:
> `git diff --stat c8b21750..HEAD -- package.json package-lock.json src/features/builder-v2/useBuilderV2Dnd.ts src/features/builder-v2/builder-v2-dnd.ts src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/BuilderV2TeamManagement.tsx src/features/builder-v2/BuilderV2TeamSlots.tsx`
> If any in-scope file changed since this plan was written, compare the audit
> evidence below against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: LOW
- **Depends on**: plans/016-normalize-builder-v2-dnd-collision-arbitration.md and plans/018-expand-builder-v2-dnd-browser-smoke.md recommended
- **Category**: migration
- **Planned at**: commit `c8b21750`, 2026-06-21

## Summary

The focused DnD audit used DnDKit's legacy documentation because MomenTB is on
the established React package family: `@dnd-kit/core`, `@dnd-kit/sortable`, and
`@dnd-kit/utilities`. Those packages are still the latest releases for their
line, but DnDKit now documents a newer package family centered on
`@dnd-kit/react` and a framework-agnostic core.

This plan is a migration assessment, not an implementation migration. Its job is
to decide whether Builder V2 should stay on the stable legacy React API after
plans 016-018, or schedule a deliberate migration to the newer DnDKit stack.

Refresh note: plans 016, 017, and 018 have landed. Builder V2 now has semantic
collision arbitration, effective target-aligned team-management feedback, and a
browser smoke gate that asserts overlays plus visible drop-zone styling. Assess
modernization from that stabilized baseline, not from the pre-016 bug state.

## Audit Evidence

- `package-lock.json` currently resolves `@dnd-kit/core@6.3.1`,
  `@dnd-kit/sortable@10.0.0`, and `@dnd-kit/utilities@3.2.2`.
- `npm view` on 2026-06-21 reported those as the latest versions for
  `@dnd-kit/core` and `@dnd-kit/sortable`.
- `npm view @dnd-kit/react` on 2026-06-21 reported `0.5.0` as latest, with a
  current beta dist-tag also present.
- The current DnDKit site positions `@dnd-kit/react` as the newer React
  integration over the vanilla library, while the docs for `useDraggable`,
  `useDroppable`, `DndContext`, `DragOverlay`, and `SortableContext` live under
  the legacy section.
- Builder V2's immediate semantic and browser-coverage failures from plans
  016-018 have been fixed locally. The assessment should now decide whether a
  DnDKit package migration would simplify future work enough to justify a
  separate migration spike.

## DnDKit References

Official sources to re-check at execution time:

- https://dndkit.com/
- https://dndkit.com/react/quickstart
- https://dndkit.com/react/guides/collision-detection
- https://dndkit.com/legacy/introduction/installation
- https://dndkit.com/legacy/api-documentation/context-provider/dnd-context
- https://github.com/clauderic/dnd-kit
- https://www.npmjs.com/package/@dnd-kit/core
- https://www.npmjs.com/package/@dnd-kit/sortable
- https://www.npmjs.com/package/@dnd-kit/react

## Scope

In scope:

- Builder V2 DnD usage only.
- Current package metadata and DnDKit migration guidance.
- A small compatibility matrix mapping current concepts to the newer package
  family: context/provider, sensors, collision detection, overlays, sortable
  lists, nested droppables, keyboard/accessibility behavior, and cross-container
  semantics.
- A recommendation document under `plans/` or `docs/refactor-goals/`.

Out of scope:

- Builder V1 / classic Builder.
- Dependency changes in this assessment slice.
- Rewriting Builder V2 DnD before plans 016-018 have stabilized target
  semantics and browser verification.

## Steps

1. Reconfirm package state.
   - Run read-only `npm view @dnd-kit/core version dist-tags --json`.
   - Run read-only `npm view @dnd-kit/sortable version dist-tags --json`.
   - Run read-only `npm view @dnd-kit/react version dist-tags --json`.
   - If any dependency-mutating experiment is needed, do it only in a separate
     implementation plan and run package-manager commands through Socket
     Firewall.

2. Build a concept map.
   - Map current `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`,
     `PointerSensor`, collision detection, and `SortableContext` usage to the
     newer package APIs.
   - Identify which current Builder V2 semantic primitives from plans 016-018
     would survive unchanged.
   - Identify which concepts would need a rewrite rather than a rename.

3. Evaluate migration value.
   - Does the newer package family materially simplify nested/cross-container
     targets?
   - Does it improve keyboard/accessibility semantics enough to justify a
     planned migration?
   - Is the newer React package mature enough for this app's Builder V2 surface?
   - Would migration reduce code, or mostly trade one API adapter for another?

4. Produce a recommendation.
   - Option A: stay on legacy core/sortable for Builder V2 and keep improving
     semantics locally.
   - Option B: schedule a contained migration spike with throwaway branch work
     and clear verification gates.
   - Option C: migrate only after Builder V2 reaches feature parity and V1 is
     retired.

## STOP Conditions

- Stop if official docs or package metadata indicate the newer React package is
  still changing too rapidly for a production migration plan.
- Stop if the assessment turns into source edits. This is a decision slice.
- Stop if the migration would require weakening Builder V2's click-first mobile
  fallback or the semantic DnD rule boundary established by plans 016-018.

## Verification

Because this is an assessment plan, verification is evidence quality:

- Package metadata commands are recorded with dates.
- Official docs links are cited.
- The recommendation names the current Builder V2 files affected by any future
  migration.
- The recommendation includes a go/no-go decision and a rollback path if a later
  migration spike is approved.

## Done Criteria

- The team has a clear answer on whether DnDKit modernization is worth pursuing
  now, later, or not at all.
- Any future migration plan is based on current package maturity and Builder V2
  semantics, not on the word "legacy" alone.

## Assessment Result

Assessed on 2026-06-21 from local HEAD `704ce10e7c92f76c000f06f6d9d427b6148d28e6`.

Decision: **Option C - defer migration until Builder V2 reaches feature parity and V1 is retired.** Keep Builder V2 on `@dnd-kit/core` / `@dnd-kit/sortable` for now and continue improving the local semantic boundary established by plans 016-018. Do not schedule a production migration immediately. If modernization is still desirable later, run it as a contained spike on a throwaway branch before any dependency change lands.

Evidence checked:

- Drift check: `git diff --stat c8b21750..HEAD -- package.json package-lock.json src/features/builder-v2/useBuilderV2Dnd.ts src/features/builder-v2/builder-v2-dnd.ts src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/BuilderV2TeamManagement.tsx src/features/builder-v2/BuilderV2TeamSlots.tsx` produced no file changes from the planned baseline.
- `npm view @dnd-kit/core version dist-tags --json` on 2026-06-21 returned `version: 6.3.1`, `latest: 6.3.1`, and `next: 6.3.1-next-202411517925`.
- `npm view @dnd-kit/sortable version dist-tags --json` on 2026-06-21 returned `version: 10.0.0`, `latest: 10.0.0`, and `next: 10.0.0-next-202410244445`.
- `npm view @dnd-kit/react version dist-tags --json` on 2026-06-21 returned `version: 0.5.0`, `latest: 0.5.0`, and `beta: 0.5.0-beta-20260611130431`.
- `npm view @dnd-kit/react time version dist-tags --json` on 2026-06-21 showed `0.5.0` published on 2026-06-11, immediately after several `0.5.0-beta` builds on 2026-05-12, 2026-05-18, and 2026-06-11.
- Official docs checked: DnDKit overview (`https://dndkit.com/`), React quickstart (`https://dndkit.com/react/quickstart/`), React migration guide (`https://dndkit.com/react/guides/migration/`), React collision guide (`https://dndkit.com/react/guides/collision-detection/`), React sensors guide (`https://dndkit.com/react/guides/sensors/`), legacy installation (`https://dndkit.com/legacy/introduction/installation/`), legacy `DndContext` (`https://dndkit.com/legacy/api-documentation/context-provider/dnd-context/`), and the official repository (`https://github.com/clauderic/dnd-kit`).

Compatibility map:

| Builder V2 concept | Current API | New-stack mapping | Assessment |
| --- | --- | --- | --- |
| Root provider and events | `DndContext` in `BuilderV2Page.tsx` with `onDragStart`, `onDragOver`, `onDragEnd`, `onDragCancel` | `DragDropProvider` from `@dnd-kit/react`; docs move cancel handling into `onDragEnd` via `event.canceled` and expose `event.operation.source` / `event.operation.target` | Rewrite, not a rename. Event payload handling in `useBuilderV2Dnd.ts` would need adaptation. |
| Draggables | `useDraggable` from `@dnd-kit/core` in picker/team/team-management components | `useDraggable` from `@dnd-kit/react`, returning a `ref` object rather than `setNodeRef` / listeners shape shown in legacy examples | Mostly mechanical at leaf nodes, but drag handles and click-first buttons need regression checks. |
| Droppables | `useDroppable` from `@dnd-kit/core`; `isOver` is supplemented by predicted semantic target state | `useDroppable` from `@dnd-kit/react`; docs expose `isDropTarget` and allow per-droppable collision configuration | Rewrite in styling glue only. Product target prediction should remain local. |
| Overlay | `DragOverlay` via `BuilderV2DragOverlay` | `DragOverlay` from `@dnd-kit/react`; migration guide shows render-prop source access and one overlay per provider | Rewrite adapter. Existing preview descriptors can survive. |
| Pointer activation | `PointerSensor` plus `useSensor` / `useSensors` with `{distance: 4}` | `PointerSensor` from `@dnd-kit/dom`; defaults are registered by provider, custom behavior uses provider or per-draggable `sensors` | Rewrite. The current click-first mobile fallback must remain the gate before enabling any drag stack. |
| Collision detection | Provider-level custom `collisionDetection` using `pointerWithin`, `closestCenter`, filtered droppables, and semantic ordering | React docs map this to `collisionDetector` on `useDroppable` / `useSortable`; built-ins come from `@dnd-kit/collision` | Meaningful rewrite. Filtering/arbitration from plans 016-018 must be preserved explicitly. |
| Team sorting | `SortableContext`, `useSortable`, `rectSortingStrategy`, CSS transform utilities | `useSortable` from `@dnd-kit/react/sortable`; migration guide says `SortableContext` and sorting strategies are no longer needed, with `type` / `accept` controlling grouping | Some simplification possible, but only for team-row sorting, not loadout semantic drops. |
| Nested/cross-container semantics | Local IDs, payloads, `resolveBuilderV2EffectiveDropTarget`, and `resolveBuilderV2DndAction` in `builder-v2-dnd.ts` | New API has richer source/target operations and multiple-list guides, but no documented replacement for Builder V2's product rules | Survives unchanged conceptually; still app-owned domain logic. |
| Keyboard/accessibility | Legacy stack can support keyboard sensors, while Builder V2 also exposes explicit move up/down buttons and click selection | New provider registers pointer and keyboard sensors by default per the React sensors guide | Potential improvement, but not enough by itself because existing Builder V2 ordering buttons already provide non-drag controls. |

Migration value:

- Nested and cross-container targets would not be materially simplified. The hard behavior is not collision math alone; it is Builder V2's semantic conversion from physical targets to valid `awakener`, `wheel`, `covenant`, `posse`, team-management, and removal actions in `builder-v2-dnd.ts`.
- Accessibility may improve at the library default level because the new provider registers pointer and keyboard sensors automatically, but Builder V2 already keeps explicit click/order controls and disables DnD in mobile mode. A migration cannot weaken those controls.
- Package maturity is acceptable for a spike, not for an immediate production migration. `@dnd-kit/react` has an official migration guide and a stable `latest` tag, but it is still `0.5.0` and the latest stable was published on 2026-06-11 after same-day beta builds. That is current enough to evaluate, but not enough to justify moving a stabilized Builder V2 surface solely because the existing docs are under "legacy".
- Code reduction would be uneven. Droppable/draggable leaf code and `SortableContext` removal may shrink some UI glue, but `useBuilderV2Dnd.ts`, `builder-v2-dnd.ts`, overlay previews, semantic target prediction, and browser smoke coverage would still be required.

Future migration spike, if approved later:

1. Work in a throwaway branch/worktree and change only Builder V2 DnD files plus package manifests.
2. Start with `BuilderV2Page.tsx`, `useBuilderV2Dnd.ts`, `BuilderV2DragOverlay.tsx`, `BuilderV2TeamManagement.tsx`, `BuilderV2TeamSlots.tsx`, picker drag sources, and `builder-v2-dnd.ts`.
3. Preserve `resolveBuilderV2EffectiveDropTarget`, `resolveBuilderV2DndAction`, predicted drop-target styling, click-first mobile behavior, and explicit team order buttons.
4. Verification gates: existing unit tests for `builder-v2-dnd.ts` / `useBuilderV2Dnd.ts`, Builder V2 page tests, the browser smoke gate from plan 018, and a manual or automated keyboard reorder/drop check if new keyboard semantics are claimed.
5. Rollback path: revert the branch/package manifest changes and remain on `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, and `@dnd-kit/utilities@3.2.2`; no persisted data format depends on the DnD package choice.

Recommendation: **no-go for production migration now; revisit after Builder V2 feature parity and V1 retirement, or earlier only as a bounded spike whose success criterion is deleting meaningful DnD adapter code without weakening semantic rules or mobile fallback.**
