# Public V3 TypeScript Remainder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not create worktrees or sub-branches for this branch. If subagents are explicitly re-enabled by the user, use them only for read-only exploration unless a later instruction says otherwise.

**Goal:** Finish the remaining website TypeScript migration after the V3 data bundle landed: remove frontend compiler slop, split the app into feature boundaries, centralize runtime/user state, preserve shipped persistence migrations, and keep computed output/formula behavior locked.

**Architecture:** V3 generated data stays behind `src/data-access/public-data`. Feature code consumes repository/domain facades, not generated JSON. Database, builder, and collection become feature modules with focused stores for cross-surface runtime state; public IDs are the runtime identity, while names/slugs are display and route concerns only. Branch-local V2/draft code is not a compatibility surface and should be replaced directly.

**Tech Stack:** React 19, React Router 7, TypeScript, Vite JSON imports/globs, Zod, Zustand, Fuse.js, Vitest, Testing Library, Playwright/browser smoke checks

---

## Source Inventory

This plan inventories and supersedes the website-side TypeScript portions of:

- `docs/notes/2026-05-04-architecture-review.md`
- `docs/plans/2026-05-04-public-v3-workload-split.md`, mainly Workload B
- `docs/plans/2026-05-04-covenant-posse-db-deslop.md`
- `docs/notes/2026-05-04-covenant-posse-db-audit.md`
- `docs/superpowers/plans/2026-05-05-public-v3-frontend-migration.md`

The tooling-side Workload A is treated as already handed off for this TypeScript plan because the website now has `src/data/public-v3` with manifest, catalogs, records, indexes, and gameplay metadata.

## Current State

What has landed:

- `src/data/public-v3` exists with catalogs, per-record chunks, indexes, and `metadata/gameplay-math.json`.
- `src/data-access/public-data` exists with contract, schemas, manifest/catalog/record/index repositories, route resolver, search repository, reference repository, asset repository, and repository tests.
- Runtime imports of generated V3 JSON are already guarded by `src/domain/public-v2-runtime-boundary.test.ts`.
- Root domain getters for awakeners, wheels, posses, and covenants now read V3 catalog data.
- Detail loaders read V3 records, although the compatibility module is still named `public-v2-detail-loaders`.
- Route slugs resolve through the generated V3 route index in `src/domain/database-paths.ts`.
- Posse and covenant database browse/search params are URL-backed.
- Builder and collection persistence serialize public IDs and keep V1 migration support.

What remains:

- There is no `src/features` tree and no `src/stores` tree.
- `src/pages/DatabasePage.tsx` is still the database controller: route parsing, redirects, browse state, search capture, detail selection, and modal routing live together.
- `src/pages/database` still owns nearly every database component.
- Detail modals are not behind a shared `DbDetailModalHost`, registry, shell, or modal stack store.
- Builder runtime state still uses `awakenerName`; public IDs exist mainly at the persistence boundary.
- Collection ownership is a domain module plus local hook state, not a focused store backed by the V3 collection catalog.
- Detail preferences, collection ownership reads, and search suppression are duplicated or module-local instead of store-backed.
- `public-v2` compatibility names and `as unknown as` casts remain in runtime TypeScript.
- Some deslop audit bugs remain real, including covenant popovers showing only the first set effect and covenant search indexing raw asset IDs.

## Workload B Status

| Workload item | Status | Remaining TypeScript work |
| --- | --- | --- |
| B0: Public Data Access Boundary | Partially complete | Harden schemas, add public repository facade APIs for all feature needs, remove direct shape casts in domain wrappers, add feature import boundary tests beyond generated JSON. |
| B1: Persistence Compatibility Inventory | Partially complete | Document shipped formats in tests and rename V2 migration symbols to current-language APIs without losing backwards-compatible exports. |
| B2: Import Boundary Tests | Partially complete | Keep V3 JSON boundary test, add no-new-`public-v2` runtime adapter tests and no-domain-`as unknown as` tests with explicit allowed exceptions. |
| B3: Covenant Browse/Detail Migration | Partially complete | Fix remaining search and popover correctness, move covenant browse/detail into feature registry and detail host. |
| B4: Posse Browse/Detail Migration | Partially complete | Move posse browse/detail into feature registry and detail host; remove simple-artifact reference shim. |
| B5: DB Detail Modal Host And Store | Not started | Create modal stack store, detail host, registry, shell, and route-bound/overlay source behavior. |
| B6: Route Resolver Integration | Partially complete | Replace manual route parsing and redirect effects with router params, registry resolution, and render-time `<Navigate>`. |
| B7: Builder Identity Migration | Partially complete | Change runtime `TeamSlot` from `awakenerName` to `awakenerId`; migrate display/search/actions and tests. |
| B8: Collection Ownership Store | Partially complete | Move ownership to a Zustand store keyed by public IDs and seed it from V3 collection catalog. |
| B9: Wheels And Awakeners | Partially complete | Data source is V3, but detail shapes, child adapters, and feature folder split remain. |
| B10: Delete Legacy V2 Adapters | Not complete | Delete compatibility scaffolding once consumers are on V3/current names; keep shipped V1 persistence fixtures. |
| B11: Final Database Page Cleanup | Not started | Split into feature routes/layout/browse/detail registries after the host/store boundary exists. |

## Non-Negotiable Invariants

- V1 user localStorage, import/export snapshots, and standard-code inputs must migrate to the current public IDs without unit shuffling.
- Branch-local V2/draft persistence and page architecture do not need deployment-style transition paths.
- Generated data identity is `{kind, id}`. Slugs are route inputs. Names are display/search inputs.
- Formula/math output, computed arg values, metadata math, substat scaling, and rich description rendering must not drift without an intentional test update.
- No raw/unparsed description tokens may leak into UI output.
- Feature code may not import `src/data/public-v3/**` directly.
- New TypeScript must not add public-v2-only architecture. Temporary compatibility shims must have explicit deletion tasks.
- Database URL params are entity-scoped; switching entity tabs cannot preserve invalid params.
- Runtime data loading should stay manifest/catalog-first and detail-record lazy.

---

## Affected File Groups

| Path | Change type | Responsibility |
| --- | --- | --- |
| `src/data-access/public-data/**` | Modify | Harden repository APIs and schemas, expose stable current-contract helpers, keep generated JSON imports here. |
| `src/domain/entities/**` | Create | Current public entity types, display formatting, description helpers, identity guards. |
| `src/domain/public-v2-detail-loaders.ts` | Delete/replace | Draft V2-named adapter module; replace with current-named detail adapter APIs and update callers directly. |
| `src/domain/*-search.ts` | Modify | Use V3 search docs consistently, remove copied helpers, fix covenant asset-id leakage. |
| `src/domain/*-assets.ts` | Modify | Resolve through V3 asset index and explicit local asset maps with tests. |
| `src/domain/database-paths.ts` and `src/domain/database-entity-paths.ts` | Modify | Route helpers become thin wrappers over generated route resolution and entity route config. |
| `src/pages/DatabasePage.tsx` | Split/delete | Move route/browse/detail control into `src/features/database`. |
| `src/pages/database/**` | Move/refactor | Components become `features/database/browse`, `features/database/detail`, or shared `src/ui`. |
| `src/features/database/**` | Create | Database routes, layout, browse registry/controller, detail host/registry/shell/body components. |
| `src/features/builder/**` | Create/move | Builder page, view model, ID-based actions, migration helpers. |
| `src/features/collection/**` | Create/move | Collection page, view model, ownership integration, migration helpers. |
| `src/stores/dbDetailStore.ts` | Create | Detail modal stack and route/overlay source behavior. |
| `src/stores/preferencesStore.ts` | Create | Shared database detail preferences and UI preferences currently duplicated in hooks. |
| `src/stores/collectionOwnershipStore.ts` | Create | Collection ownership state, persistence, import/export mutation surface. |
| `src/stores/builderDraftStore.ts` | Create | Builder draft state, autosave, reset/import/replace actions. |
| `src/ui/modal/**`, `src/ui/cards/**`, `src/ui/filters/**`, `src/ui/search/**` | Create/move | Shared UI primitives extracted from page feature folders. |
| `src/App.tsx` | Modify | Use feature route modules and remove repeated database route declarations. |
| `src/domain/persistence-contract*.test.ts`, `src/pages/builder/*.test.ts`, `src/pages/collection/*.test.ts`, `src/pages/DatabasePage.test.tsx` | Modify | Preserve behavior while public IDs and feature boundaries change. |

---

## Phase 0: Current Guardrails And Known Bugs

Do this before large moves so failures are crisp.

- [x] Add or update tests for covenant popover hydration in `src/domain/global-database-reference-layer.test.ts`.
  - Expected behavior: covenant reference hydration includes every set effect for the covenant, not only `setEffects[0]`.
  - Focused command: `npm run test -- --run src/domain/global-database-reference-layer.test.ts`.

- [x] Fix `src/domain/global-database-reference-layer.ts` to hydrate covenants through `loadPublicV2CovenantFullById` or the new current-named detail loader and join all set effects.
  - Remove the `getCovenantsFullV2().find(...).setEffects[0]` path.
  - Verify the focused test passes.

- [x] Add covenant search tests in `src/domain/covenants-search.test.ts`.
  - Cases: same-priority results sort by display name, raw asset ids like `covenant-icon-001` do not create user-facing search hits, generated aliases/tokens still search correctly.
  - Focused command: `npm run test -- --run src/domain/covenants-search.test.ts`.

- [x] Fix `src/domain/covenants-search.ts`.
  - Remove `covenant.assetId` from indexed supplemental values.
  - Add the locale-compare tiebreaker used by the other search modules.
  - Reuse a shared priority helper after Phase 1 creates it, or keep the local fix here and delete the local helper in Phase 1.

- [x] Add a direct asset integrity test in `src/domain/covenant-assets.test.ts`.
  - Every covenant must resolve icon and full-art assets through the V3 asset index and current local asset files.
  - Focused command: `npm run test -- --run src/domain/covenant-assets.test.ts`.

- [x] Add a route/query regression test in `src/pages/DatabasePage.test.tsx`.
  - Cases: generated canonical slug redirects preserve only entity-valid query params; invalid slugs render a browse redirect; old `/database/awk/:slug` redirects to `/database/awakeners/:slug`.
  - Focused command: `npm run test -- --run src/pages/DatabasePage.test.tsx`.

Phase 0 exit criteria:

- The known audit bugs have failing tests before fixes and passing tests after fixes.
- No broad folder move has happened yet.

## Phase 1: Public Data And Domain Facade Hardening

This phase turns the current V3 wiring into a stable TypeScript boundary.

- [x] Create `src/domain/entities/types.ts`.
  - Export current public `EntityKind`, `EntityRef`, root entity interfaces, entity-scope mapping helpers, and branded ID guard functions.
  - Source `EntityKind` and `EntityRef` from `src/data-access/public-data/contract.ts` rather than duplicating string unions.

- [x] Create `src/domain/entities/display.ts`.
  - Move display-only helpers such as canonical name formatting, realm/mainstat labels, and generated route display helpers here.
  - Keep display helpers pure and data-input based.

- [x] Create `src/domain/entities/description.ts`.
  - Centralize rich description record builders for awakeners, wheels, posses, covenants, child skills, overlays, talents, enlightens, and derived skills.
  - Keep formula-context inputs explicit so metadata math cannot become implicit global state.

- [x] Create `src/domain/entities/search.ts`.
  - Move `toPriority` and shared direct/fuzzy merge helpers out of per-entity search modules.
  - Keep entity-specific Fuse weights and cutoffs local where behavior differs.

- [x] Create `src/domain/public-detail-record-adapters.ts`.
  - Move V3 detail loading/adaptation out of `public-v2-detail-loaders.ts`.
  - Export current-named functions such as `loadPublicAwakenerDetailById`, `loadPublicWheelDetailById`, `loadPublicPosseDetailById`, and `loadPublicCovenantDetailById`.
  - Use Zod schemas or typed parser helpers at adapter input points instead of `as unknown as`.

- [x] Replace `src/domain/public-v2-detail-loaders.ts` directly.
  - Create current-named detail loaders in `public-detail-record-adapters.ts`.
  - Update all runtime callers in the same phase.
  - Delete the V2-named module before Phase 1 exits unless a test fixture still imports it.

- [x] Replace runtime imports of `loadPublicV2*FullById` with current-named detail loaders.
  - Primary consumers: `src/pages/DatabasePage.tsx`, `src/pages/database/AwakenerBuildsTab.tsx`, detail route hooks, and tests.
  - Focused command: `npm run test -- --run src/domain/public-v2-detail-loaders.test.ts src/pages/DatabasePage.test.tsx`.

- [x] Tighten architecture boundary tests.
  - Update `src/domain/public-v2-runtime-boundary.test.ts` or create `src/architecture/public-data-boundary.test.ts`.
  - Assert generated V3 JSON imports stay in `src/data-access/public-data/**`.
  - Assert runtime code does not add new `public-v2` data adapters.
  - Assert domain runtime files do not contain `as unknown as` except named, reviewed compatibility files.

- [x] Replace domain casts with parser/adapters.
  - Target files: `src/domain/awakener-kits.ts`, `src/domain/awakener-roster.ts`, `src/domain/awakeners-lite-v2.ts`, `src/domain/covenants-full-v2.ts`, `src/domain/posses-full-v2.ts`, `src/domain/wheels-full-v2.ts`, `src/domain/public-v3-awakener-record-adapters.ts`.
  - Verification: new boundary test passes and existing domain tests pass.

- [x] Source builder and collection catalog facts from V3 repositories.
  - Update `src/domain/collection-ownership.ts` so `createDefaultCollectionOwnershipCatalog()` reads `getPublicCollectionCatalog()` instead of rebuilding all grouping facts from root getters.
  - Update builder helper modules to use `getPublicBuilderCatalog()` for valid option IDs and lineup token mappings.
  - Keep user-owned state out of generated catalog data.

Phase 1 exit criteria:

- V3 repository APIs are the only generated-data boundary.
- Runtime call sites use current contract names.
- Search and asset fixes from Phase 0 remain passing.
- `npm run test -- --run src/data-access/public-data/repository.test.ts src/domain/public-v2-runtime-boundary.test.ts` passes.

## Phase 2: Database Feature Shell And Browse Registry

This phase creates the feature folder target without changing detail modal behavior yet.

- [x] Create `src/features/database/routes.tsx`.
  - Define database route objects/elements for browse and detail paths.
  - Route old `/database/awk/:slug` paths through explicit redirect handling.
  - Use React Router params instead of manual string splitting.

- [x] Create `src/features/database/DatabaseLayout.tsx`.
  - Move the beta notice, tab layout, and shared browse frame out of `src/pages/DatabasePage.tsx`.
  - Keep detail host integration out until Phase 3.

- [x] Create `src/features/database/browse/entityBrowseRegistry.ts`.
  - Registry entries define entity ID, scope, title, unit noun, catalog source, search function, filter component, chip builder, view controls, grid component, and allowed URL params.
  - Registry replaces `activeEntity === 'x'` render branching for browse.

- [x] Create `src/features/database/browse/useEntityBrowseController.ts`.
  - Own active entity, sanitized search params, active search actions, reset filters, filtered count, total count, and open-detail callback.
  - Replace the four-way `useGlobalSearchCapture` if/else blocks with `activeBrowseController.searchActions`.

- [x] Move URL-backed browse state modules into the feature.
  - Move `src/pages/database/useDatabaseBrowseState.ts`, `useWheelsDatabaseBrowseState.ts`, and `useSimpleArtifactDatabaseBrowseState.ts` into `src/features/database/browse`.
  - Keep domain parsing helpers in `src/domain` if they are pure and tested.

- [x] Replace `src/pages/DatabasePage.tsx` directly with the feature implementation.
  - Prefer moving the file to `src/features/database/DatabasePage.tsx` and updating imports rather than leaving a wrapper.
  - If a tiny wrapper is useful for one commit-sized step, delete it before Phase 2 exits.

- [x] Update tests.
  - Move route/browse tests from `src/pages/DatabasePage.test.tsx` into `src/features/database/DatabaseRoutes.test.tsx`.
  - Delete the old page-level test file once the feature route tests cover the same behavior.
  - Focused command: `npm run test -- --run src/features/database/DatabaseRoutes.test.tsx src/pages/DatabasePage.test.tsx`.

Phase 2 exit criteria:

- Browse rendering is registry-driven.
- Entity-scoped URL params are centrally declared.
- Database browse no longer requires editing one god component to add an entity.

## Phase 3: Database Detail Host, Registry, And Stores

This phase removes page-coupled modal ownership.

- [x] Create `src/stores/dbDetailStore.ts`.
  - Store a stack of `{kind, id}` entries plus source metadata: database route-bound, builder overlay, collection overlay.
  - Actions: `openDetail`, `replaceRouteDetail`, `pushReferenceDetail`, `popDetail`, `closeAllDetails`, `syncFromRoute`.
  - The store does not load generated data.

- [x] Create `src/stores/preferencesStore.ts`.
  - Move database detail preferences from per-modal `useState` into a Zustand vanilla store.
  - Keep synchronous localStorage writes in store actions.
  - Update `src/pages/database/useDatabaseDetailPreferences.ts` to read/write through the store during the move.

- [x] Move search suppression into a store-backed API.
  - Replace module-level `searchCaptureSuppressionDepth` and listeners in `src/pages/database/useDetailEntitySearch.ts`.
  - Store latest search query in a ref during render so keydown listener does not re-register on every character.

- [x] Create `src/features/database/detail/dbDetailRegistry.tsx`.
  - Registry maps entity kind to detail loader, body component, label, missing route behavior, and cross-entity select behavior.
  - Include awakeners, wheels, posses, and covenants in the first pass.

- [x] Create `src/features/database/detail/DbDetailShell.tsx`.
  - Own modal shell chrome, settings button, close button, art viewer hook, popover root, keyboard lifecycle, and focus management.
  - Existing body components receive loaded record, formula context, reference layer, and navigation actions.

- [x] Create `src/features/database/detail/DbDetailModalHost.tsx`.
  - Reads `dbDetailStore`.
  - For route-bound database details, invalid IDs render a browse redirect.
  - For builder/collection overlays, invalid IDs close that stack entry without navigation.
  - Reference clicks call `pushReferenceDetail({kind, id})`.

- [x] Split detail bodies.
  - Move `AwakenerDetailModal` internals into `AwakenerDetailBody.tsx`.
  - Move `WheelDetailModal` internals into `WheelDetailBody.tsx`.
  - Split `SimpleArtifactDetailModal` into `PosseDetailBody.tsx` and `CovenantDetailBody.tsx`.
  - Delete `src/domain/simple-artifact-database-reference-layer.ts` after body code uses scoped description/reference helpers.

- [x] Convert route-bound detail rendering to the host.
  - `DatabaseRoutes` derives route `{kind, id}` through generated route resolver and syncs `dbDetailStore`.
  - `DbDetailModalHost` renders the top route-bound modal.
  - Close from a route-bound detail navigates to the current entity browse route with sanitized search.

- [x] Update lifecycle/effect tests.
  - Tests: preferences shared across concurrently mounted detail bodies, search suppression stack increments/decrements safely, Escape handler does not depend on changing booleans, invalid detail routes redirect during render.
  - Focused command: `npm run test -- --run src/features/database/detail src/pages/database/useDetailEntitySearch.test.tsx src/pages/database/useDatabaseDetailPreferences.test.tsx`.

Phase 3 exit criteria:

- Database, builder, and collection can all open the same detail host by `{kind, id}`.
- Detail body components do not own routing.
- No module-level mutable search suppression state remains.

## Phase 4: Builder Runtime Identity And Store

This phase removes the largest user-data risk: runtime name identity.

- [x] Create `src/features/builder/builderMigrations.ts`.
  - Move shipped V1 and current builder migration logic out of `src/pages/builder/builder-persistence.ts`.
  - Resolve old names/codes/groups through public ID migration maps and V3 builder/entity indexes.
  - Update imports directly; do not preserve branch-local V2 API names for compatibility.

- [x] Create `src/stores/builderDraftStore.ts`.
  - Store teams, active team ID, quick lineup state, active selection, edit state, and autosave actions.
  - Persist public IDs only.
  - Keep display preferences in existing builder preference storage unless Phase 6 moves them to `preferencesStore`.

- [x] Change runtime `TeamSlot` in `src/features/builder/types.ts`.
  - Replace `awakenerName?: string` with `awakenerId?: string`.
  - Keep display helpers that resolve name/realm/rarity from entity repository.
  - Wheels, covenants, and posses remain public IDs.

- [x] Update builder action modules.
  - Move and update `createBuilderAwakenerActions.ts`, `createBuilderWheelActions.ts`, `createBuilderCovenantActions.ts`, `createBuilderPosseActions.ts`, `team-state.ts`, `transfer-resolution.ts`, and quick-lineup helpers to use public IDs.
  - Search, ownership checks, duplicate prevention, and recommendation logic must not compare by display name.

- [x] Move builder page files into `src/features/builder`.
  - Update `src/App.tsx` to import the feature page directly.
  - Delete `src/pages/BuilderPage.tsx` after the import moves.
  - `useBuilderViewModel.ts` should become a composition of store selectors and pure derived selectors, not one large hook with autosave, filters, searches, ownership, quick lineup, and UI edit state mixed together.

- [x] Integrate builder with `DbDetailModalHost`.
  - Picker cards and active team cards open detail overlays by public `EntityRef`.
  - Explicit "open database page" action navigates to the canonical generated route.

- [x] Add migration and behavior tests.
  - Tests: V1 name-based builder draft loads into ID runtime; current public-ID draft round-trips; duplicate/transfer/quick-lineup behavior does not shuffle units; import/export still accepts shipped formats.
  - Focused command: `npm run test -- --run src/features/builder src/pages/builder/builder-persistence.test.ts src/domain/persistence-contract.test.ts`.

Phase 4 exit criteria:

- Builder runtime identity is public ID based.
- Builder persistence still accepts shipped V1 data.
- Builder UI still displays names, but actions no longer depend on names as identity.

## Phase 5: Collection Ownership Store And Feature Module

This phase makes collection state reactive and catalog-driven.

- [x] Create `src/features/collection/collectionMigrations.ts`.
  - Move parse/serialize/migration helpers out of `src/domain/collection-ownership.ts` where they are persistence-specific.
  - Keep pure ownership math separate from storage IO.

- [x] Create `src/stores/collectionOwnershipStore.ts`.
  - Store ownership state, display unowned flag, awakener levels, remembered levels, import/export actions, and persistence status.
  - Seed valid IDs and linked groups from `getPublicCollectionCatalog()`.
  - Persist user deltas keyed by public IDs.

- [x] Refactor `src/domain/collection-ownership.ts`.
  - Keep pure functions: normalize, set owned level, clear entry, linked-awakener level propagation, snapshot parse/serialize.
  - Remove direct dependence on `getAwakeners`, `getWheels`, and `getPosses` after catalog injection exists.

- [x] Move collection page files into `src/features/collection`.
  - Update `src/App.tsx` to import the feature page directly.
  - Delete `src/pages/CollectionPage.tsx` after the import moves.
  - `useCollectionViewModel.ts` should consume `collectionOwnershipStore` selectors and pure sort/filter selectors.

- [x] Integrate collection with `DbDetailModalHost`.
  - Collection cards open detail overlays by public `EntityRef`.
  - Export-rendering components continue to receive the exact data shape they need; do not mix export layout state into the ownership store.

- [x] Add migration and behavior tests.
  - Tests: V1 collection ownership migrates to current IDs; linked awakener groups preserve ownership/level; import/export snapshots round-trip; bulk filtered actions only affect visible filtered public IDs.
  - Focused command: `npm run test -- --run src/features/collection src/domain/collection-ownership.test.ts src/pages/collection/useCollectionViewModel.test.ts`.

Phase 5 exit criteria:

- Collection ownership is public-ID keyed and store-backed.
- Collection import/export remains backwards compatible.
- Builder and database can observe ownership changes through the same store.

## Phase 6: Shared UI Extraction

This phase happens after feature behavior is stable so components move once.

- [x] Create `src/ui/search`.
  - Move `DatabaseSearchInput`, search capture helpers that are not database-specific, and reusable search empty/loading primitives.

- [x] Create `src/ui/filters`.
  - Move segmented controls, select wrappers, active filter chips, and filter layout primitives that are used by database/builder/collection.

- [x] Create `src/ui/cards`.
  - Move `DatabaseGridCardFrame`, common catalog card typography, wheel/posse/covenant tile primitives where they are not feature-specific.

- [x] Create `src/ui/modal`.
  - Move modal shell primitives, focus scope helpers, art viewer overlay primitives, and settings panel primitives after `DbDetailShell` is stable.

- [x] Update imports across feature modules.
  - Feature modules may compose UI primitives, but UI primitives may not import feature modules.
  - Add an architecture test if cycles or reverse imports appear.

Phase 6 exit criteria:

- Shared UI code is no longer trapped inside `src/pages/database`.
- Feature code owns game-specific behavior; `src/ui` owns reusable presentational primitives.

## Phase 7: Route Module Finalization And Legacy Page Removal

This phase makes feature folders the actual application structure.

- [x] Update `src/App.tsx`.
  - Import route elements from `src/features/database/routes.tsx`, `src/features/builder/BuilderPage.tsx`, and `src/features/collection/CollectionPage.tsx`.
  - Remove repeated database route declarations from `App.tsx` when the database feature exports its route children.

- [x] Delete migrated feature implementations under `src/pages`.
  - Delete `src/pages/DatabasePage.tsx`, `src/pages/BuilderPage.tsx`, and `src/pages/CollectionPage.tsx` after `src/App.tsx` imports the feature pages/routes.
  - Keep only genuinely generic pages such as home and timeline in `src/pages`.

- [x] Move tests to feature paths.
  - `src/pages/DatabasePage.test.tsx` becomes `src/features/database/DatabaseRoutes.test.tsx`.
  - Builder and collection integration tests move under their feature folders or keep a single app-route smoke file.

- [x] Run focused route and app tests.
  - Command: `npm run test -- --run src/App.test.tsx src/features/database/DatabaseRoutes.test.tsx src/features/builder src/features/collection`.

Phase 7 exit criteria:

- `src/features` is the owning tree for database, builder, and collection.
- `src/pages` no longer contains large feature implementations.

## Phase 8: Legacy Compatibility Deletion

This phase removes old scaffolding without breaking shipped user data.

- [x] Delete current-named replacements' old shims.
  - Delete `src/domain/public-v2-detail-loaders.ts` after all runtime imports use current-named detail loaders.
  - Rename or delete `awakeners-lite-v2.ts`, `awakeners-full-v2.ts`, `wheels-full-v2.ts`, `posses-full-v2.ts`, and `covenants-full-v2.ts` only after their exported shapes have current homes.

- [x] Delete frontend-derived compiler helpers replaced by V3 indexes.
  - Targets include frontend slug derivation as authority, global reference stubs generated from runtime joins, asset stem inference as public contract, and numeric owner bridges.
  - Keep pure display slug fallback helpers only for noncanonical UI labels, never for identity.

- [x] Preserve shipped persistence fixtures and migration maps.
  - `src/domain/persistence-contract.v1.json` and tests for shipped V1 inputs stay.
  - Rename exported constants to `*_CURRENT` where possible while keeping compatibility exports for importers that still use V2 names.

- [x] Add final architecture tests.
  - No runtime `public-v2` module names outside shipped V1 persistence migration history.
  - No generated JSON imports outside `src/data-access/public-data`.
  - No domain/runtime `as unknown as` casts outside explicitly allowed generic UI typing.
  - No feature module imports from `src/pages`.

Phase 8 exit criteria:

- V2 exists only as shipped persistence history, not as runtime app architecture.
- Old page and domain scaffolding cannot creep back in without tests failing.

## Phase 9: Full Verification And Browser Smoke

- [x] Run `npm run format:changed`.
- [x] Run `npm run lint`.
- [x] Run `npx tsc -p tsconfig.app.json --noEmit --pretty false`.
- [x] Run `npm run test:bounded`.
  - Passed 155 files / 984 tests.
- [x] Run `npm run build`.
  - Passed with only the Vite/Rolldown plugin timing warning.
- [x] Browser smoke database:
  - `/database`
  - `/database/awakeners/goliath`
  - `/database/wheels/blue-ringed-toxin`
  - `/database/posses?realm=CHAOS&q=voice`
  - `/database/posses/voices-in-your-head`
  - `/database/covenants?q=deus`
  - `/database/covenants/deus-ex-machina`
  - old `/database/awk/:slug` redirect
- [x] Browser smoke builder:
  - Load a V1/local saved draft fixture.
  - Assign awakeners, wheels, covenant, and posse.
  - Open details from picker and team cards.
  - Export/import and confirm units stay in their slots.
- [x] Browser smoke collection:
  - Load a V1/local ownership fixture.
  - Toggle awakeners, wheels, and posses.
  - Change linked awakeners and confirm linked levels stay unified.
  - Export/import ownership.
- [x] Slime/output sweep:
  - Search rendered snapshots and built assets for `[StateArg`, `[DescArg`, `[Arg`, `NaN`, `undefined`, raw formula tokens, and unparsed template markers.
  - Re-run targeted formula/detail tests for metadata math, substat scaling, covenant set effects, posse effects, wheel mainstat/substat output, and awakener upgrade descriptions.

Full completion criteria:

- All verification commands pass.
- Feature folders and stores exist and own their respective scopes.
- Public IDs are runtime identity across database, builder, and collection.
- V1 persistence migration support is still covered by tests and browser smoke.
- No remaining TypeScript runtime architecture depends on `public-v2` as a data contract.

## Execution Bias

This branch has no production V2 transition requirement. Execute as a direct replacement:

1. Write the regression tests that protect V1 persistence and formula/output behavior.
2. Replace the draft V2-named TypeScript architecture with current V3/current-contract modules.
3. Update callers in the same phase instead of preserving branch-local wrappers.
4. Delete branch-local shims before the phase exits.
5. Keep only shipped V1 persistence compatibility and its tests.

## Risks

- Builder runtime ID migration is the highest user-data risk because V1 user data exists. Mitigation: migrate tests first, use V3 alias/entity indexes, and round-trip V1 fixtures before UI changes.
- Detail host can accidentally mix route-bound and overlay-only behavior. Mitigation: model detail source explicitly in `dbDetailStore`.
- Public-data schemas may be too loose because current wrappers adapted around them. Mitigation: harden repository schemas before deleting adapters.
- Search behavior can drift while moving to generated docs. Mitigation: keep direct result-order tests for representative queries.
- Formula output can drift when detail records move. Mitigation: snapshot targeted metadata math and substat scaling cases before refactors.
- Store extraction can become a dumping ground. Mitigation: stores own user/runtime state only; generated data stays in repositories.

## Execution Recommendation

Execute phases in order. Phase 0 and Phase 1 can be batched together if tests stay readable. Phase 4 and Phase 5 should not be done in the same unverified batch because both touch persistence and user data.
