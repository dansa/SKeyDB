# Public V2 Migration Audit

Date: 2026-05-02
Branch: `codex/v2-public-data-migration`

## Scope

Audit the website as a consumer of synced public V2 data under `src/data/public-v2`.
The tooling repo remains the source of truth for generated public records; website changes should
focus on validation, loading, relationship resolution, rendering, and UI consumption.

## Fixed Website Findings

These were confirmed website-side bugs from the audit and are patched on this branch.

- **Popover formula context dropped** (`src/pages/database/DatabaseReferencePopover.tsx`,
  `src/pages/database/DatabasePopoverRoot.tsx`, `src/pages/database/useDatabasePopoverController.ts`).
  Website rendering bug. Popover rich descriptions could render computed public V2 args as `—`
  even when detail/card views had formula context.
- **Popover Suspense fallback used raw templates** (`src/pages/database/DatabaseReferencePopover.tsx`).
  Rendering/component bug. Lazy fallback could show raw `[ArgN]`, plural, or ordinal syntax before
  rich content loaded.
- **Resolved reference metadata ignored formula context** (`src/domain/awakeners-database-view.ts`,
  `src/domain/database-reference-layer.ts`, `src/domain/wheels-database-reference-layer.ts`).
  Website resolver/domain bug. Non-rich descriptions and reference previews could disagree with
  rich detail rendering for computed args.
- **Asset resolvers preferred old root posse/covenant paths** (`src/domain/posse-assets.ts`,
  `src/domain/covenant-assets.ts`). Asset migration bug. Root duplicates masked the fact that the
  current icon layout under `Icon/` was not the primary resolver path.
- **Public V2 validation missed derived child and upgrade relationships**
  (`src/domain/public-v2-schema.ts`). Schema/type weakness. Broken `childDerivedSkillIds` and
  `upgrades[].upgraderId` links could pass validation while the loader/UI relies on them.
- **Awakener build id alignment was not validated** (`src/domain/public-v2-schema.ts`).
  Schema/type weakness. The intended numeric alignment between `awakener-build-000N` and
  `awakener-000N` was not enforced.
- **Fresh public V2 sync check was absent from verification** (`package.json`).
  Sync/stale-output hazard. Normal verification could pass with stale `src/data/public-v2` output.
- **Public V2 schema validation was too broad for core records**
  (`src/domain/public-v2-schema.ts`). Schema/type weakness. The validator now requires the
  stable fields the website consumes for each scope, validates public upgrade entries, and keeps
  controlled catchall JSON only for additive future fields.
- **Runtime upgrade handling synthesized old patch fields for convenience**
  (`src/domain/public-v2-detail-loaders.ts`, `src/domain/awakeners-full-v2-resolver.ts`,
  `src/domain/awakeners-database-view.ts`). Website resolver/domain bug. The loader no longer
  writes `upgradeTargetIds`/`upgradePatches` onto talents or enlightens; resolver and influence
  badge code now read target-side public V2 `upgrades[]` records directly.
- **Retired website-authored full/lite compiler artefacts still existed**
  (`src/domain/awakeners-full-v2-compiler.ts`, `src/domain/awakeners-lite-v2-compiler.ts`,
  `scripts/compile-awakeners-full-v2.mjs`, `scripts/derive-awakeners-lite-v2.mjs`). Dead migration
  architecture. The local compiler path is removed; the website consumes synced public V2 output.
- **Posse/covenant runtime paths still used V1 compatibility data for display/assets**
  (`src/domain/posses.ts`, `src/domain/posse-assets.ts`, `src/domain/covenants.ts`,
  `src/domain/covenant-assets.ts`). Runtime compatibility leak. These now resolve from public V2
  ids and current icon assets without importing `posses-lite.json` or persistence id maps.
- **Wheel mainstat scaling lived in a website-owned table**
  (`src/domain/wheel-mainstat-scaling.ts`). Public data boundary weakness. The website now reads
  wheel scaling from public V2 wheel envelope metadata and validates that metadata before resolving
  enhance values.
- **Public V2 aggregate validators rejected producer metadata**
  (`src/domain/public-v2-schema.ts`, `src/domain/awakeners.ts`, `src/domain/wheels.ts`,
  `src/domain/covenants.ts`, `src/domain/posses.ts`, `src/domain/awakener-builds.ts`). Schema/type
  weakness. Aggregate envelopes now accept top-level public metadata while keeping record schemas
  strict around the fields the runtime consumes.

## Needs Context Or Decision

These are not patched in the website yet because they are schema direction, tooling/public-data, or
intentional compatibility questions.

- Skill, talent, enlighten, derived-skill, and overlay IDs use slug-like domain IDs rather than a
  numeric canonical regex. This is acceptable because these entries are content-derived records that
  can change when characters are reworked; numeric stability is reserved for durable entity scopes
  such as awakeners, wheels, covenants, posses, relics, and awakener builds.

## Intentional Compatibility Bridges

- The website still has legacy compatibility boundaries for persisted user data:
  `src/pages/builder/builder-persistence.ts`,
  `src/pages/collection/collection-ownership.ts`, and
  `src/domain/persistence-id-migration.v2.ts`. These are intentional read-forward bridges for
  existing localStorage payloads, not runtime V1 database consumption.

## Cleanup Follow-Ups

- `awakener-source-schema.ts` remains as a poorly named shared UI/detail type module. It no longer
  owns target-side upgrade patches, but it should be renamed once the remaining UI type imports are
  flattened into public V2 detail/view model modules.

## Public Data / Tooling Gaps

- `scripts/sync-public-v2-data.mjs` defaults to the sibling tooling output path
  `../MomenTB-Tools/outputs/public`. Directionally, the authoritative sync/export command should
  live in the tooling repo so maintainers do not need private local update paths; the website can
  keep a check-only validator for already-synced public data.
- Contracts/maps/reference records: no public V2 scopes were found in this website repo. My take is
  to add public scopes only if the website will render or validate them as product content. If they
  are purely tooling compile inputs, keep them out of website public data; if database routes,
  reference popovers, recommendations, or build validation need them, emit them as explicit public
  scopes instead of reusing private/tooling shapes.
- Public V2 upgrade metadata was verified on target records rather than enlighten records. Examples:
  `skill.24.frenzied-slash` has an upgrade from `enlighten.24.hysteria`,
  `skill.alva.combat-stance` from `enlighten.alva.unyielding-bastion`,
  `overlay.clementine.phobic-fixation` and `overlay.clementine.symbiosis` from
  `enlighten.clementine.you-will-recover`, `overlay.hameln.rondino` from
  `enlighten.hameln.oneiric-waltz`, `overlay.wanda.murmurs` from
  `enlighten.wanda.lakeborne-dweller`, and `overlay.xu.spellbound` from
  `enlighten.xu.nirvanas-kiss`.
- Public V2 source text still has formatting/normalization examples for tooling to clean:
  `enlighten.karen.creamy-frosting` wraps the whole sentence in quotes and uses compact
  `effects +25%`; `enlighten.doresain.evernights-revel` has
  `subsequent"Evernight's Revel"` without a space; `enlighten.xu.fan-and-scythe` has
  `"Strike" and" "Defense"` quote spacing; `enlighten.mouchette.mist-realm-traveler`,
  `enlighten.ramona.precious-ties`, and `enlighten.salvador.book-of-genesis` contain spaced
  `+ 0.15%`, `+ 50%`, or `+ 25%` formatting.

## Browser QA Notes

- Existing Vite listener on `http://localhost:5173` returned HTTP 200 for:
  - `/database#/database/awk/agrippa/skills`
  - `/database#/database/awk/xu/skills`
- Playwright MCP browser attach was blocked by an existing profile lock:
  `Browser is already in use for C:\Users\dansa\.codex\tmp\playwright-mcp-profile`.
  I did not close that browser session. Visual/click QA should be rerun once the profile is free.

## Targeted Tests / Verification

- `npm run test -- --run src/pages/database/DatabaseReferencePopover.test.tsx`
- `npm run test -- --run src/pages/database/useDatabasePopoverController.test.tsx src/pages/database/DatabaseReferencePopover.test.tsx`
- `npm run test -- --run src/domain/posse-assets.test.ts src/domain/covenant-assets.test.ts`
- `npm run test -- --run src/domain/public-v2-schema.test.ts`
- `npm run test -- --run src/domain/awakeners-database-view.test.ts src/domain/wheels-database-reference-layer.test.ts`
- `npm run test -- --run src/domain/awakener-source-schema.test.ts src/domain/awakener-enlightens.test.ts src/domain/public-v2-runtime-boundary.test.ts`
- `npm run data:check-public-v2`
- `npx tsc -b --pretty false`

Current state after the no-shim cleanup pass:

- `npm run verify` passes after removing the stale root lite/token data slice.
- `npx tsc -b --pretty false` passes.
- `npm run data:check-public-v2` passes.
- The broader targeted Vitest migration slice passes.
- `npm run format:changed` passes with chunked Prettier invocation for large regenerated public-data
  diffs.

## Patch Log

- Threaded `PublicFormulaContext` through popover controller/root/portal/popover content.
- Resolved popover fallback text through `resolveDescriptionTemplate`.
- Passed formula context into database shell/reference/overlay/wheel reference resolution.
- Preferred current posse and covenant `Icon/` asset folders while preserving legacy fallback.
- Added public V2 relationship validation for derived child links and upgrade upgrader IDs.
- Added awakener build id/awakener id numeric alignment validation.
- Added `data:check-public-v2` and included it in `verify`.
- Removed runtime/test imports of `src/data/awakeners`, `src/data/wheels`, and root
  `src/data/awakener-builds.json`; deleted those retired data trees.
- Replaced the wheel detail/reference path with public V2 `WheelFullV2Record` loading.
- Removed V1 wheel compile scripts/domain modules and old awakener compile/derive package scripts.
- Added `src/domain/public-v2-runtime-boundary.test.ts` to prevent new runtime imports of retired
  V1 data paths or wheel V1 naming.
- Added public V2 `OverExalt` enlighten-slot support to the old shared domain schema while leaving
  persisted V1-to-V2 migration bridges intact.
- Tightened public V2 schema validation for core scope fields and upgrade entry shape.
- Switched wheel mainstat scaling to public V2 wheel metadata instead of a website-owned constant.
- Accepted public V2 aggregate metadata in runtime validators.
- Removed the retired root covenant/wheel/relic lite data files. Covenants/wheels now expose public
  V2 `lineupToken` fields from lite records, and relic portrait lookup now uses public V2 full relic
  `ownerAwakenerId`/`assetId`.
- Removed the local in-game token dictionary data and old wheel sync script. In-game import/export
  dictionaries are now derived from public V2 `lineupToken` metadata on awakeners, wheels, covenants,
  and posses.
