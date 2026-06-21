# DnD Semantics Execute Handoff

Prepared on 2026-06-21 from a focused `$improve deep` audit of DnDKit usage in
MomenTB. This is a planning handoff only; no source code was changed in the audit
thread.

## Package/API Baseline

Installed DnDKit packages:

- `@dnd-kit/core@6.3.1`
- `@dnd-kit/sortable@10.0.0`
- `@dnd-kit/utilities@3.2.2`
- `@dnd-kit/accessibility@3.1.1` as a transitive package

Use the legacy `@dnd-kit/core` / `@dnd-kit/sortable` APIs. Do not copy newer
`@dnd-kit/react` examples directly unless they are translated back to the
installed package APIs.

Official docs reviewed:

- https://dndkit.com/
- https://dndkit.com/react/guides/collision-detection
- https://dndkit.com/legacy/api-documentation/context-provider/dnd-context
- https://dndkit.com/legacy/api-documentation/context-provider/collision-detection-algorithms
- https://dndkit.com/legacy/presets/sortable/overview
- https://dndkit.com/legacy/api-documentation/draggable/drag-overlay
- https://dndkit.com/legacy/api-documentation/sensors
- https://dndkit.com/legacy/guides/accessibility
- https://github.com/clauderic/dnd-kit

## Recommended Execution Order

1. `016-normalize-builder-v2-dnd-collision-arbitration.md`
   - Highest leverage and likely root cause for the reported team-list
     cross-team wheel no-op.
   - Must preserve team sorting and picker remove behavior.

2. `017-align-builder-v2-team-management-dnd-feedback.md`
   - Depends on 016 because visual feedback should follow stabilized effective
     target semantics.
   - Keep CSS vocabulary stable.

3. `018-expand-builder-v2-dnd-browser-smoke.md`
   - Depends on 016 and preferably 017.
   - Converts the browser smoke from "one mutation happened" into a visible DnD
     semantics proof.

4. `020-assess-builder-v2-dndkit-modernization-path.md`
   - Run after 016 and preferably after 018.
   - Decide whether the newer `@dnd-kit/react` package family is worth a later
     Builder V2 migration, or whether V2 should stay on `@dnd-kit/core` /
     `@dnd-kit/sortable` for now.

`019-require-classic-builder-posse-drop-target.md` is rejected/deferred after
product clarification. Builder V1/classic Builder is due for retirement and
should receive DnD changes only for breaking issues.

## Checkpoint Expectations

For plan 016:

- Start with failing pure tests in `builder-v2-dnd.test.ts`.
- Prove non-team drags ignore sortable team-row IDs.
- Prove team-sort drags still see sortable row IDs.
- Keep `resolveBuilderV2DndAction` as the final rule boundary.

For plan 017:

- Test rendered class behavior for broad slot, exact wheel, and exact covenant
  targets.
- Avoid duplicating assignment logic in React components.

For plan 018:

- Make the smoke assert overlay visibility and drop-zone classes during pointer
  drag.
- Keep mobile pointer DnD skipped; mobile is currently click/tap driven.
- On failure, include enough screenshot/bounding-box context to debug CI.

For plan 020:

- Re-check current official docs and package metadata.
- Map current Builder V2 concepts to the newer DnDKit React package family.
- Recommend stay, later migration, or a contained migration spike.

## Subagent Guidance

Read-only scout agents are useful for:

- Rechecking DnDKit import maps after source changes.
- Auditing CSS selectors touched by plan 017.
- Reviewing browser-smoke selectors for brittleness before plan 018 lands.

Read-only scouts must not edit files, create branches, update plans, spawn
agents, or coordinate the thread. Use implementation agents only for source
edits after the executor has read the relevant plan.

## Must-Run Gates

Common gates after any Builder V2 DnD source change:

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint`
- `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run`
- `npm run test:integration:builder-v2`
- `npm run verify:builder-v2:browser`

Additional gates:

- Plan 018: always run `npm run verify:builder-v2:browser`.
- Plan 020: record read-only package metadata and cited official docs; do not
  mutate dependencies in the assessment slice.

## Non-Goals

- Do not enable mobile pointer DnD in these plans.
- Do not spend active implementation time on Builder V1/classic Builder DnD
  unless a breaking issue appears before V2 replaces it.
- Do not add `KeyboardSensor` as a drive-by fix. Current Builder V2 policy is
  pointer DnD as progressive enhancement with click-first fallbacks and no
  DnDKit keyboard affordance advertisement.
- Do not rewrite Builder V2's resolver boundary. The pure resolver is a strength;
  the issue is live DnDKit candidate arbitration and UI feedback drift.
- Do not publish remote state without explicit user permission.
