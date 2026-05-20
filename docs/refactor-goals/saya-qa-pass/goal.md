# Refactor Goal: saya-qa-pass

## Intake

Status:
- [x] Intake completed from the user's QA rundown and scout reports
- [ ] Intake skipped explicitly by user

Mode: Refactor goal workflow for the post-Saya QA pass.
Risk posture: Moderate product QA. Prefer bounded root fixes with focused characterization over broad rewrites; preserve existing routes, data contracts, and visual style unless the QA item explicitly asks for a change.
Harness update policy: Goal docs, focused tests, and current public-v3 generated tag fixes are allowed. No dependency, AGENTS.md, lint-rule, deploy, push, or PR changes without explicit approval.
Allowed areas: `src/domain/**`, `src/features/database/**`, `src/pages/timeline/**`, `src/data/public-v3/**`, focused tests, and this goal packet.
Protected areas: remote publishing, dependency files, unrelated Builder/Collection behavior except shared stat/sort consumers, unrelated tooling repo output, and broad redesign outside the seven QA issues.
Max worker-slice size: One concept-complete issue slice spanning producer, direct consumers, and focused tests.
Stop condition: Stop when all seven issues are implemented or terminal, a product/design decision is required, verification fails twice for the same slice, or scope expands beyond the QA list.

## Objective

Solve the seven-user-named QA issues after the Saya pre-release pass:

1. 24 Rouse card overlay scaling context.
2. Main/sub substat scaling distinction in filtering.
3. Posse/covenant card max sizing.
4. Default-maxed Gnostic talent stats in browse/sort contexts.
5. Awakener detail tab reshuffle: hide Overview/Builds, add Lore last, default Upgrades.
6. Upcoming banner end-date visibility and date hover target.
7. Persist database sorting preferences.

## Success Criteria

- Every QA item is implemented, explicitly blocked with a concrete reason, superseded by an implemented slice, or out of scope by user.
- Existing Saya/tag-fix dirty data stays coherent with regenerated catalogs/indexes.
- Focused tests cover behavior changes where feasible.
- Browser/manual checks cover visual/layout slices.
- Goal state/worklog record receipts for every checkpoint.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/saya-qa-pass
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| Issue 1: 24 Rouse overlay scaling | queued | Scout found data ladders are present; rank context is dropped when overlay popover opens from a scaled skill. | Worker slice C1. |
| Issue 2: main/sub substat filtering | queued | Scout found role is inferable from per-stat scaling magnitude but not encoded in state/UI. | Worker slice C2. |
| Issue 3: posse/covenant card max size | queued | Scout found square-art grid uses `auto-fit` with `1fr`, causing filtered cards to stretch. | Worker slice C3. |
| Issue 4: Gnostic stats in browse/sort | queued | Scout found detail applies default-maxed Gnostic via full records, while browse uses lite catalog stats only. | Worker slice C4; may need generated catalog field. |
| Issue 5: Awakener detail tabs | queued | Scout mapped default Overview routing, visible Builds tab, and overview-owned lore/story state. | Worker slice C5. |
| Issue 6: upcoming banner end dates | queued | Scout found end date only in native `title`, with title on broad wrapper/drawer targets. | Worker slice C6. |
| Issue 7: persisted database sorting | queued | Scout found sort writes only URL params and safe storage helpers already exist. | Worker slice C7. |
| Current public-v3 tag fixes | queued | Dirty tree adds generated tag/facet/search changes for Castor, Arachne, and Saya. | First checkpoint C0. |

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| C0: checkpoint current public-v3 tag fixes | S1 | queued | `src/data/public-v3/records/awakeners/*`, regenerated catalogs/indexes/manifest | Dirty tree contains coherent tag fixes and generated artifacts. | Active W0 validates/checkpoints before code slices. |
| C1: preserve originating skill rank when opening scaled overlay references | S1 | queued | `RichDescription`, rich segment token/render path, popover context/trail actions, overlay tests | 24 Rouse data and Realm/Persona overlay ladders exist; `descriptionRank` is lost at popover boundary. | Characterize then worker slice. |
| C2: add low-bloat main/sub scaling filter role | S2 | queued | `awakener-scaling-substats`, database browse state, filters, view model tests | Main/sub role is inferable from stat-specific high/low scaling values. | TypeScript + React worker slice. |
| C3: cap square-art posse/covenant grid tracks | S3 | queued | `database.css`, simple artifact grids, browser checks | `auto-fit` + `1fr` lets few cards fill page. | Tailwind/CSS worker slice. |
| C4: include default-maxed Gnostic bonuses in lite browse/sort stats | S2 | queued | public-v3 catalog generation/data, `awakeners.ts`, sorting/card tests | Browse uses catalog stats; detail-only path applies Gnostic bonuses from talents. | Architecture/TypeScript worker slice; prefer generated catalog field over loading full records. |
| C5: hide Overview/Builds, add Lore last, default Upgrades | S4 | queued | database paths, modal host, tab list, lore component/tests, route tests | Current default is Overview; Builds visible but empty; lore lives in Overview. | React/UI-a11y worker slice with route characterization. |
| C6: show upcoming banner end date and tighten hover target | S5 | queued | `timeline.ts`, `BannerCard`, `BannerInfoDrawer`, timeline tests | Long-range upcoming banners show start only; date title on broad/hard-to-discover targets. | React/UI-a11y worker slice. |
| C7: persist awakener/wheel sort preferences | S3 | queued | browse hooks, safe storage preference module, parse/state tests, route tests | Sort state is URL-only; safe storage utilities already exist. | React/TypeScript worker slice. |

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| Atlas/spritesheet for tiny assets | future Cloudflare Pages file pressure | `$refactor-rootfix` / `$refactor-architecture` | out_of_scope_by_user | User explicitly deferred this to another day. |
| Generated tag-fix workflow drift | dirty generated data arrives during QA | `$refactor-learning-maintainer` | queued | Consider only if validation shows recurring mismatch between records and generated indexes. |

## Non-goals / Protected Behavior

- Do not push, create PRs, deploy, or mutate remote state.
- Do not add dependencies.
- Do not solve Cloudflare Pages file count with spritesheets in this goal.
- Do not rework Builder/Collection except where shared stat/sort domain behavior makes it necessary.
- Do not alter public-v3 generated data by hand beyond preserving already landed tooling output; prefer tooling output when new generated fields are needed.

## Repo Facts

Package manager: npm with `package-lock.json`.
Stack: Vite, React 19, TypeScript, Tailwind CSS v4, Zustand, Zod, Vitest, ESLint.
Validation commands: focused `npx vitest run ...`, `npm run lint`, `npm run test:bounded`, `npm run test:scripts`, `npm run build`, `npm run verify` for broad checkpoints.
Relevant AGENTS.md files: no root file on disk; thread instructions require FFF for search and forbid closing running subagents.
Relevant docs/ADRs: existing local refactor packets under `docs/refactor-goals/`; archived database detail audit under `docs/archive/refactor-goals/`.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Broad multi-issue QA workflow | `$refactor-goal-prep`, `$refactor-scout`, `$refactor-worker-slice`, `$refactor-review` | yes | Packet state is durable truth. |
| React/TSX hooks, routing, tabs, timeline/date UI, browse state | `$refactor-react`, `$refactor-ui-a11y` | yes | Preserve keyboard/focus/link semantics. |
| Tailwind/CSS grid sizing and visual overflow | `$refactor-tailwind`, `$refactor-ui-a11y` | yes | Browser check desktop/mobile. |
| Runtime types, URL state, storage preferences, inferred scaling roles | `$refactor-typescript` | yes | Validate at boundaries and keep URL links deterministic. |
| Cross-boundary root causes: popover rank, Gnostic catalog stats, generated data | `$refactor-rootfix`, `$refactor-complexity` | yes | Prefer concept-complete root fixes over local patches. |
| Weak behavior coverage before route/scaling changes | `$refactor-characterization-tests` | yes | Add focused tests before risky changes. |
| Dependency changes | `$refactor-dependencies` | no | No dependency work approved or needed. |

## First Tranche

Type:
- [x] read-only scout
- [x] one bounded data checkpoint
- [ ] one bounded root-fix slice
- [ ] React simplification
- [ ] Tailwind/custom CSS cleanup
- [ ] TypeScript/trust-boundary cleanup
- [ ] UI/a11y route/date/layout cleanup

Allowed files/areas: current public-v3 dirty tag files; then one candidate slice at a time.
Protected files/areas: dependency files, unrelated routes, remote state.
Expected simplification: Clean checkpoint boundary before code slices, then resolve each QA issue at its root boundary.
Validation: goal checker, focused tests per slice, `npm run lint`, browser checks for visual/UI slices, broad verify before final commit if feasible.
Rollback: revert the current worker slice files and restore `state.json`/`worklog.md` to previous task state.

## Goal Loop

### Scout

Read-only discovery. Completed by six scout agents. Reports are summarized in `state.json` S1 receipt and candidates C0-C7.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Completion requires evidence. If any candidate register row is still `queued`, final audit remains incomplete.

### Maintenance

Run maintenance only for recurring workflow/harness issues found during implementation.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every task transition must be logged in `worklog.md`.
- Worker slices edit only approved concept files.
- Planning is not completion.
- Every candidate must end as `implemented`, `blocked`, `out_of_scope_by_user`, or `superseded`.

## Root-fix vs Patch Policy

Before implementing a recurring-smell patch, record why a root fix is not selected. Prefer root fixes for popover rank propagation, generated Gnostic browse stats, and persistent sort preferences because local patches would preserve the confused boundary.

## Dependency Policy

Any `package.json`, lockfile, dependency add/remove/update, or library choice requires `$refactor-dependencies`. No dependency changes are expected.

## Harness / Learning Policy

If a slice reveals repeated generated-data mismatch, route a maintenance item to `$refactor-learning-maintainer` or `$refactor-lint-law`.

## Receipts

Each worker slice must record changed files, behavior preserved/changed, root-fix decision, validation run, risks, follow-ups, and scope expansion.

## Characterization Policy

Add or identify the smallest safety rail before changing overlay rank propagation, default tab routing, persisted sort precedence, or Gnostic browse stats.
