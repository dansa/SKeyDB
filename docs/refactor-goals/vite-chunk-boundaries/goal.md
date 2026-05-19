# Refactor Goal: vite-chunk-boundaries

## Intake

Status:
- [x] Intake completed
- [x] Intake skipped explicitly by user

Mode: refactor goal workflow after targeted bundle/chunk scout.
Risk posture: conservative, behavior-preserving slices only.
Harness update policy: add or update characterization tests before changing data-loading boundaries that affect visible route behavior.
Allowed areas: Vite chunk boundaries, route lazy boundaries, data repository loading seams, build measurement docs inside this goal packet.
Protected areas: patch data correctness, migration flow behavior, Cloudflare deployment settings, unrelated UI restyling.
Max worker-slice size: one concept boundary per Worker slice.
Stop condition: stop when the selected slice needs wider product decisions, validation fails twice, scope expands beyond one concept, or the current tranche is implemented and reviewed.

## Objective

Reduce avoidable large Vite chunks in SKeyDB by moving heavy data or UI work behind route-appropriate boundaries without changing user-visible behavior.

## Success Criteria

- The current over-limit chunk cause is understood and either fixed in a bounded slice or explicitly blocked.
- Top chunk candidates are tracked with evidence and next tasks.
- Any implementation keeps GitHub Pages and Cloudflare Pages builds working.
- Validation includes at least `npm run test:bounded`, `npm run lint`, `npm run build:quiet`, and a `VITE_BASE_PATH=/SKeyDB/` build when build/runtime boundaries change.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/vite-chunk-boundaries
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| Vite chunk boundaries | done | `useTimelineNow-*.js` fell from ~879.6 kB minified / ~109.7 kB gzip to ~130.1 kB / ~24.9 kB gzip. | C1 implemented; no current Vite `>500 kB` warning after measurement. |
| Data-loading architecture seams | partially done | `src/domain/dzone.ts` now loads full season archives on demand; `catalogRepository.ts` and `searchRepository.ts` still statically import all public-v3 scopes. | Leave public-v3 catalog/search for a separate branch because the remaining chunk is below warning threshold and broader risk. |
| React route/lazy boundaries | queued | Database routes share one lazy `DatabasePage`; browse registry imports every entity browse view. | Queue after data-loading seams unless measurements show higher user impact. |
| TypeScript trust boundaries | queued | Candidate seams parse JSON at module load; moving loaders must preserve parsed types and validation ownership. | Use `$refactor-typescript` in Judge/Worker. |
| Dependency/manual chunk strategy | mapped | No manual chunk strategy in `vite.config.ts`; scouts recommend fixing boundaries before manual chunks. | Do not touch unless boundary fixes fail or dependency review says otherwise. |

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| Split D-Zone current summary from full archive data | S1 | done | `src/domain/dzone.ts`, `src/pages/DZonePage.tsx`, `src/pages/DZoneHistoryPage.tsx`, D-Zone tests, build output measurement | `useTimelineNow-*.js` contained all `src/data/dzone/seasons/*.json` because `dzone.ts` used eager glob and both current and archive routes imported it. | Implemented with lazy archive loaders and page-level async loading. |
| Split public-v3 catalog repository by scope | S1 | queued | `src/data-access/public-data/catalogRepository.ts`, scope consumers in `src/domain/*`, repository tests | `catalogRepository.ts` statically imports all 11 catalog JSON files; any scope use can pull all catalogs. | Separate future slice only; current chunk is ~486.0 kB / ~58.4 kB gzip and below warning threshold. |
| Split public search indexes or lazy Fuse/search data | S1 | queued | `src/data-access/public-data/searchRepository.ts`, `src/domain/public-search.ts`, database search UI/tests | Search repository statically imports every search JSON and `public-search.ts` imports Fuse. | Queue after catalog boundary measurement. |
| Split database browse registry by entity | S2 | queued | `src/features/database/routes.tsx`, `DatabasePage.tsx`, browse registry/views, database route tests | One lazy `DatabasePage` imports all entity browse/data infrastructure. | Queue after data-loading seams. |
| Lazy-load shared detail modal host on first open outside database | S2 | queued | Timeline, Builder, Collection pages, `DbDetailModalHost`, db detail store/tests | Non-database routes import database detail orchestration even if details are never opened. | Queue if route chunks remain chunky after data seams. |
| Measure broad recordRepository URL map | S1 | queued | `src/data-access/public-data/recordRepository.ts`, build output | URL/no-inline glob avoids raw record payload, but generated map may still cost chunk bytes. | Measurement task only; no implementation until evidence. |
| React icons duplication | S1 | mapped | `react-icons/fa6` route imports | Multiple static icon imports across routes; likely minor after tree-shaking. | Do not touch without analyzer evidence. |

## Scope Expansion Protocol

Worker slices remain bounded by `allowed_files`, but the allowed set should be large enough for the approved concept.

If Worker discovers another file is required for the same approved concept, Worker must stop with:

```text
needs_scope_expansion:
Concept:
Additional files:
Why same concept:
Behavior risk:
Verification update:
```

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| Build chunk measurement script | repeated manual measurement | `$refactor-lint-law` / `$refactor-dependencies` | queued | Consider only after at least one implementation slice proves the measurement needs to recur. |

## Non-goals / Protected Behavior

- Do not change the 2.5.1 data fix values.
- Do not change migration copy, manual migration flow, or Cloudflare settings.
- Do not add dependencies or manual chunking without `$refactor-dependencies`.
- Do not rewrite database browse UI as part of the D-Zone slice.

## Repo Facts

Package manager: npm.
Validation commands: `npm run format:check`, `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, `npm run build:quiet`, `VITE_BASE_PATH=/SKeyDB/ npm run build:quiet`.
Relevant AGENTS.md files: root user AGENTS guardrails supplied in thread; no publishing remote state without explicit permission.
Relevant docs/ADRs: existing `docs/refactor-goals/` packets; no chunk-specific ADR found during this audit.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Route lazy boundaries and React pages | `$refactor-react`, `$refactor-architecture` | yes | Preserve route behavior and loading states. |
| JSON loaders, Zod parsing, env/runtime trust boundaries | `$refactor-typescript`, `$refactor-architecture` | yes | Keep validation at data ingress and preserve refined types. |
| Large shared chunks, repeated imports, eager globs | `$refactor-complexity`, `$refactor-architecture` | yes | Measure before/after with Vite build output. |
| Dependency or manual chunk strategy | `$refactor-dependencies` | conditional | Required before dependency changes or manual chunk strategy. |
| Behavior-preserving split with weak route coverage | `$refactor-characterization-tests` | conditional | Add tests before risky D-Zone/public-v3 loader moves. |
| Repeated measurement/check harness | `$refactor-lint-law` | later | Only if manual chunk audits repeat. |

## First Tranche

Type:
- [x] read-only scout
- [x] architecture seam cleanup
- [x] React simplification
- [x] TypeScript/trust-boundary cleanup

Allowed files/areas: read-only scouts completed; next Judge may choose the D-Zone data-loading seam.
Protected files/areas: patch data values, migration behavior, Cloudflare settings.
Expected simplification: current D-Zone page should not need to load every historical season archive to render current season.
Validation: existing D-Zone tests, bounded tests, lint, build, GitHub Pages base-path build, Vite chunk size comparison.
Rollback: revert the Worker slice commit.

## Goal Loop

### Scout

Read-only discovery. Completed in-thread with two scout agents and local build measurement.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review`. Completion requires evidence. If any candidate register row is still `queued`, completion must be `not_complete` and the next task should remain queued.

## Root-fix vs Patch Policy

Prefer boundary fixes over `manualChunks` until measurement proves manual chunking is the right root fix.

## Dependency Policy

Any `package.json`, lockfile, dependency add/remove/update, analyzer dependency, or manual chunk strategy requires `$refactor-dependencies`.

## Harness / Learning Policy

If chunk audits repeat, consider a build-size script or CI warning rather than relying on ad hoc console reads.

## Receipts

Each worker slice must record files changed, behavior preserved, before/after chunk size evidence, validation run, risks, and follow-ups not done.

## Characterization Policy

Before moving data-loading boundaries, identify or add route/domain tests that pin current current-season/archive behavior and GitHub Pages base-path behavior.
