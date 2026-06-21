# Plan 020: Assess Builder V2 DnDKit Modernization Path

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report; do
> not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer dispatched you and told you they maintain
> the index.
>
> **Drift check (run first)**:
> `git diff --stat 990ae1bc..HEAD -- package.json package-lock.json src/features/builder-v2/useBuilderV2Dnd.ts src/features/builder-v2/builder-v2-dnd.ts src/features/builder-v2/BuilderV2Page.tsx src/features/builder-v2/BuilderV2TeamManagement.tsx src/features/builder-v2/BuilderV2TeamSlots.tsx`
> If any in-scope file changed since this plan was written, compare the audit
> evidence below against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S-M
- **Risk**: LOW
- **Depends on**: plans/016-normalize-builder-v2-dnd-collision-arbitration.md and plans/018-expand-builder-v2-dnd-browser-smoke.md recommended
- **Category**: migration
- **Planned at**: commit `990ae1bc`, 2026-06-21

## Summary

The focused DnD audit used DnDKit's legacy documentation because MomenTB is on
the established React package family: `@dnd-kit/core`, `@dnd-kit/sortable`, and
`@dnd-kit/utilities`. Those packages are still the latest releases for their
line, but DnDKit now documents a newer package family centered on
`@dnd-kit/react` and a framework-agnostic core.

This plan is a migration assessment, not an implementation migration. Its job is
to decide whether Builder V2 should stay on the stable legacy React API after
plans 016-018, or schedule a deliberate migration to the newer DnDKit stack.

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
- Builder V2's immediate failures are semantic and UX maintainability issues:
  mixed droppable arbitration, nested target feedback, and missing browser
  coverage. Those are worth fixing before any package migration.

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
