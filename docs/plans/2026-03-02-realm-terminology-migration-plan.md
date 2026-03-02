# Realm Terminology Migration Plan

## Goal

Migrate the codebase to game-correct terminology in one PR:

- `realm` becomes the canonical field for the Chaos / Aequor / Caro / Ultra / Neutral / Other-style grouping.
- `faction` becomes the canonical field for the awakener grouping taxonomy introduced in the new awakener data.
- Runtime behavior, persistence, import/export, and data files must agree on the new terminology before merge.

This is not a UI copy pass. The primary scope is backend/runtime correctness and contract consistency.

## Why This PR Cannot Merge As-Is

Current PR data changes introduce:

- `src/data/awakeners-lite.json`
  - new `faction` values like `The Fools`, `Outlanders`, `Hybrid`
  - new `realm` values like `CHAOS`, `AEQUOR`, `CARO`, `ULTRA`

But current runtime code still treats:

- `awakener.faction` as the old realm value
- builder slot `faction` as the old realm value
- team rules `faction` as the old realm value
- collection filters/sorting `faction` as the old realm value

So the branch is currently semantically broken even if type-checks/tests happen to stay green.

## Required Scope

### 1. Data contract migration

All realm-like datasets must expose the same concept with the same field name:

- `src/data/awakeners-lite.json`
  - keep new `faction`
  - keep new `realm`
- `src/data/wheels-lite.json`
  - rename realm-like `faction` to `realm`
- `src/data/posses-lite.json`
  - rename realm-like `faction` to `realm`

`NEUTRAL` and `OTHER` remain within the `realm` concept for now.

### 2. Domain type migration

Patch domain loaders/types so the runtime contract is explicit:

- `src/domain/awakeners.ts`
  - expose both `realm` and `faction`
- `src/domain/wheels.ts`
  - expose `realm`
- `src/domain/posses.ts`
  - expose `realm`

No runtime consumer should still depend on realm-like values being stored under `faction`.

### 3. Runtime behavior migration

Everywhere the old realm contract is intended, switch from `faction` to `realm`.

Primary areas:

- builder team slot state
- team validation / realm cap rules
- collection awakener filters
- builder awakener filters
- collection/builder sorting/grouping that uses realm semantics
- realm tint/icon helpers
- search fields that currently include realm under `faction`
- wheel/posse realm-sensitive filters or comparisons

### 4. Persistence and import/export compatibility

This migration must not silently brick existing saved builder data.

Required compatibility behavior:

- old persisted builder slot `faction` values must still load as `realm`
- new persistence should write canonical `realm`
- standard import/export should decode into canonical `realm`
- any old runtime assumptions that deserialize `faction` as realm need fallback handling

Backward compatibility is required at the boundary even though the internal contract changes.

### 5. Naming cleanup in code

Code-level terminology should be corrected wherever the old meaning is misleading:

- helpers like `factions.ts` should become realm-oriented or be renamed
- team-rule helper names should speak in terms of realm, not faction
- builder slot properties should use `realm`
- derived sets/maps/filters should use `realm` in names when that is the actual meaning

This is not purely cosmetic. The naming cleanup is part of preventing future drift.

## Merge Requirements

This PR is not merge-ready until all of the following are true:

- awakeners, wheels, and posses use consistent realm terminology in data and runtime types
- no core runtime path still relies on realm data under the old `faction` field
- builder persistence can still load legacy drafts that stored realm under `faction`
- standard import/export round-trips still work after the migration
- builder and collection realm-sensitive behavior still works with the renamed contract
- `npm run lint` passes
- targeted tests covering domain/persistence/runtime migration pass
- `npm run verify` passes

## Explicit Non-Goals

Not required for this PR:

- final UI copy polish for labels/buttons/headings
- broader database redesign beyond this terminology migration
- changing in-game export token dictionaries
- introducing a new persistence version unless compatibility proves impossible

## Implementation Order

1. Patch raw JSON field names for wheels and posses.
2. Patch domain loaders/types to expose canonical `realm`.
3. Patch persistence/import-export boundaries with legacy fallback support.
4. Patch builder/runtime/team-rule state to use `realm`.
5. Patch collection/runtime/sorting/search consumers to use `realm`.
6. Update tests for the new contract and verify.

## Review Focus

When the implementation is done, review must explicitly check:

- semantic correctness, not just type compatibility
- persistence compatibility for existing local drafts
- no leftover mixed `realm` / old-realm-as-`faction` logic
- no partial migration where awakeners differ from wheels/posses in concept ownership
