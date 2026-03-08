# Awakener Builds Guide Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add curated awakener build recommendations through a dedicated data contract that powers the Database detail `Guide` tab and optional Builder wheel/covenant promotion without bloating `awakeners-lite.json` or forcing Builder to load `awakeners-full.json`.

**Architecture:** Keep build data in a third, focused dataset: `src/data/awakener-builds.json`. Own parsing, validation, cached loading, lookup, and recommendation ranking in `src/domain/*`, then let Database and Builder consume that shared domain output. Database should lazy-load this dataset only when the guide surface is needed, and Builder should use the same cached loader plus small persisted toggles to reorder wheels/covenants while preserving current fallback sort behavior when no curated build exists.

**Tech Stack:** React 19, TypeScript, Vite JSON imports, Zod, Vitest

---

**Status:** In progress

**Last updated:** 2026-03-08

**Related docs:**
- Notes: `docs/notes/2026-03-02-database-split-notes.md`
- Roadmap item: `docs/roadmap.md`
- Backlog source: `docs/backlog.md`

## Scope

- Add a dedicated awakener-build dataset with stable IDs and strict validation.
- Support 1-N named builds per awakener, with one explicit primary build for Builder use.
- Render build content in the Database detail `Guide` tab with empty/loading states.
- Reuse the same data in Builder to promote recommended wheels and covenants.
- Support an optional second wheel-ranking toggle for matching recommended wheel mainstats.
- Support recommendation presentation inside normal Builder slot selection and quick-lineup flows wherever the slot is already the active target.
- Add authoring support for the curated dataset through generated JSON Schema autocomplete.
- Add regression coverage for domain parsing/ranking, Database guide rendering, and Builder recommendation ordering.

## Out of Scope

- Team-comp curation for the `Teams` tab.
- Long-form prose guides, rotation notes, or matchup text.
- Wheel, covenant, or posse `full` dataset expansion.
- Per-build selection UI inside Builder beyond choosing one primary build in data.

## Risks / Watchpoints

- Builder ambiguity for multi-build awakeners: solve this with a required or inferred `primaryBuildId` and keep Builder on one deterministic build until a dedicated builder-side build selector is justified.
- Recommendation data must only reorder lists, never hide or invalidate options.
- Missing guide data must degrade cleanly: Database shows an empty state and Builder keeps its current sort order.
- Keep `awakeners-lite.json` operational-only and `awakeners-full.json` detail-only; do not leak build payload into either file.
- `useBuilderViewModel.ts` is already large, so new async recommendation state should be extracted if the added logic would make that file materially worse.

## Progress Snapshot

- Done:
  - Added `src/data/awakener-builds.json` with seeded entries for `doll: inferno` and `kathigu-ra`.
  - Added `src/domain/awakener-builds.ts` and regression coverage for validation, lookup, schema generation, and ranking helpers.
  - Added generated schema support via `scripts/generate-awakener-builds-schema.mjs`, `schemas/awakener-builds.schema.json`, and `.vscode/settings.json`.
  - Replaced the placeholder Database `Guide` tab with lazy-loaded curated build rendering and tests.
  - Added Builder recommendation promotion, persisted toggles, active-slot build resolution, and picker chips for wheel/covenant recommendations.
  - Passed `npm run lint`, `npm run test:unit`, `npm run test:integration`, and `npm run build`.
- In progress:
  - Final repo gate is blocked by the repo's existing `npm run format:check` failures during `npm run verify`.
- Next:
  - Keep feature work scoped to real review feedback or follow-up content entry.
- Blockers:
  - `npm run verify` currently fails before lint/tests/build because the repo already has broad Prettier drift outside this feature scope.

## Behavior Contract

- Each awakener may have zero or more curated builds.
- Each build has a stable `id`, short display `label`, ordered `substatPriorityGroups`, ordered `recommendedCovenantIds`, and grouped wheel recommendations.
- Wheel recommendation groups must support at least:
  - `BIS_SSR`
  - `ALT_SSR`
  - `BIS_SR`
  - `GOOD`
- A build may also define ordered `recommendedWheelMainstats` for the optional Builder promotion toggle.
- Database renders all builds for an awakener.
- If only one build exists, Database should not waste space on a redundant headline like `DPS Build` unless the content actually needs a distinguishing label.
- Builder uses the entry's `primaryBuildId`, or the first build if no explicit primary is present.
- Builder recommendations apply when the selected awakener slot is active, including quick-lineup flows that already drive picker state through the same active-slot selection path.
- Unknown awakener, wheel, covenant, or mainstat references fail validation during data load.

## Recommended Data Shape

Use a new aggregated file:

`src/data/awakener-builds.json`

Each entry should be keyed by stable awakener identity, not array position:

```json
[
  {
    "awakenerId": 101,
    "primaryBuildId": "dps",
    "builds": [
      {
        "id": "dps",
        "label": "DPS",
        "summary": "Default damage setup.",
        "substatPriorityGroups": [["CRIT_RATE"], ["CRIT_DMG", "DMG_AMP"]],
        "recommendedWheelMainstats": ["CRIT_RATE", "CRIT_DMG"],
        "recommendedWheels": [
          {"tier": "BIS_SSR", "wheelIds": ["B04"]},
          {"tier": "ALT_SSR", "wheelIds": ["SR25"]},
          {"tier": "BIS_SR", "wheelIds": ["SR25"]}
        ],
        "recommendedCovenantIds": ["005", "010"]
      }
    ]
  }
]
```

Design notes:

- Prefer `awakenerId`, `wheelIds`, and `covenantIds` over names for stable identity.
- Model substat priority as ordered groups, not a display string, so `A > B = C > D` is represented as `[["A"], ["B", "C"], ["D"]]`.
- Keep tiered wheel groups as arrays so future categories can be added without reshaping the entire file.
- Keep `recommendedCovenantIds` ordered, not tiered, unless real content demands more structure later.
- Keep `summary` optional so the first version can be mostly reference data.
- Keep this file semantically about builds, not prose guides, even if the UI tab label remains `Guide`.

## Ownership Plan

- `src/data/awakener-builds.json`
  - Canonical curated content only.
- `src/domain/awakener-builds.ts`
  - Zod schema, exported types, cached async loader, lookup helpers, and ranking helpers.
- `src/pages/database/*`
  - View-level loading state and rendering only.
- `src/pages/builder/*`
  - Picker toggle state, selected-slot recommendation resolution, and UI wiring.

### Task 1: Build Data Contract And Domain Helpers

**Files:**
- Create: `src/data/awakener-builds.json`
- Create: `src/domain/awakener-builds.ts`
- Create: `src/domain/awakener-builds.test.ts`
- Modify: `src/domain/awakeners-full.ts`
- Create: `schemas/awakener-builds.schema.json`
- Create: `scripts/generate-awakener-builds-schema.mjs`

**Status:** Done

### Task 2: Render Curated Builds In The Database Guide Tab

**Files:**
- Modify: `src/pages/database/AwakenerDetailModal.tsx`
- Modify: `src/pages/database/AwakenerGuideTab.tsx`
- Create: `src/pages/database/AwakenerGuideTab.test.tsx`
- Modify: `src/pages/database/AwakenerDetailModal.test.tsx`

**Status:** Done

### Task 3: Promote Recommended Wheels And Covenants In Builder

**Files:**
- Modify: `src/pages/builder/useBuilderPreferences.ts`
- Modify: `src/pages/builder/BuilderSelectionControls.tsx`
- Modify: `src/pages/builder/useBuilderViewModel.ts`
- Modify: `src/pages/builder/useBuilderViewModel.test.ts`
- Modify: `src/pages/BuilderPage.wheels.test.tsx`
- Modify: `src/pages/BuilderPage.covenants.test.tsx`
- Create: `src/pages/builder/useAwakenerBuildRecommendations.ts`

**Status:** Done

### Task 4: End-To-End Verification And Polish

**Files:**
- Modify: touched files from Tasks 1-3 as needed for fixes only

**Status:** In progress

**Verification snapshot:**
- `npm run lint`: PASS
- `npm run test:unit`: PASS
- `npm run test:integration`: PASS
- `npm run build`: PASS
- `npm run verify`: BLOCKED by existing repo-wide `format:check` failures outside this feature scope

## Implementation Notes

- Keep Builder recommendation use deliberately advisory. It should feel like a ranking assist, not an enforced rules engine.
- For multi-build awakeners, Database can show all builds immediately, but Builder should stay on the single primary build until there is a clear product need for slot-level build selection.
- If guide content later grows beyond reference data into full prose, keep the prose in a separate detail-oriented dataset rather than expanding `awakener-builds.json` into a second `full` payload by accident.
- If maintaining the curated file becomes noisy, add a later `data:sync-awakener-builds` script that creates missing empty entries from `awakeners-lite.json`.
- Authoring ergonomics are a real concern with ID-only references. Keep the shipped data model ID-only, but support editing with generated JSON Schema autocomplete that shows readable labels while inserting raw IDs.

## Verification

- `npm run lint`
- `npm run test:unit`
- `npm run test:integration`
- `npm run build`
- `npm run verify`

## Archive Trigger

Move this file to `docs/archive/plans/` when the work is shipped, abandoned, or superseded.
