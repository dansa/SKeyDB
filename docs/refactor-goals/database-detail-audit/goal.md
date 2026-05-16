# Refactor Goal: database-detail-audit

## Intake

Status:
- [x] Intake completed from user-supplied continuation rules and prior goal packets
- [ ] Intake skipped explicitly by user

Mode: Refactor Discipline goal workflow on the current refactor branch.
Risk posture: behavior-preserving, but continue broad in-scope work until candidates are terminally resolved; "too big" is not a blocker by itself.
Harness update policy: use existing validation and tests; record learning/lint/harness candidates, but do not edit harness or AGENTS.md unless a later task explicitly approves it.
Allowed areas: `src/domain` database/detail/reference layers, `src/features/database/**`, public detail record adapters/resolvers, rich text/reference rendering, popover/detail modal/tab controller flows, and domain collection scans only when they directly feed database/detail behavior.
Protected areas: builder feature work, collection feature work except direct type/test fallout, broad visual redesign, unrelated route/app shell changes, dependency/lockfile changes without review.
Max worker-slice size: one concept-complete slice with producer, direct consumers, and directly relevant tests/fixtures.
Stop condition: stop only for a concrete product ambiguity, unsafe scope expansion, dependency/harness decision, repeated verification failure, or a blocker that cannot be characterized safely inside the allowed scope.

## Objective

Continue the current refactor branch with a focused domain/database/detail audit, then implement bounded, verified slices that simplify database/detail contracts, public detail boundaries, rich text/reference rendering, and popover/detail modal/tab controller flows.

## Success Criteria

- Parallel scout reports cover each user-named focus area with evidence.
- Every candidate is tracked as `implemented`, `queued`, `blocked` with a concrete reason, `superseded`, or `out_of_scope_by_user`.
- At least one high-impact multi-file, root-fix, or god-function/detail-flow candidate is implemented or concretely blocked by evidence.
- Worker slices use explicit concept blast radius, protected behavior, validation commands, and receipts.
- Final audit uses `$refactor-review` before any completion claim.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/database-detail-audit
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| `src/domain` database/detail/reference layers | queued | Prior packets plus active Scout S1 | Reconcile domain/detail scout findings |
| `src/features/database/**` | queued | Prior packets plus active Scout S1 | Reconcile React/detail flow scout findings |
| Public detail record adapters/resolvers | mapped | `docs/archive/plans/2026-05-16-refactor-heavy-slices.md` R1/R2 completed | Verify residual candidates from S1 |
| Rich text/reference rendering | queued | R3 completed token grammar extraction; active Scout S1 | Reconcile rich text/reference scout findings |
| Popover/detail modal/tab controller flows | queued | Active Scout S1 | Reconcile database React scout findings |
| Direct database/detail collection scans | queued | Active Scout S1 | Reconcile domain scan evidence |

Terminal statuses: `implemented`, `blocked`, `out_of_scope_by_user`, `superseded`.
Non-terminal statuses: `not_started`, `queued`, `mapped`.

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| Public V3 child adapter trust boundary | Prior heavy-slices R1 | implemented | `public-detail-record-adapters`, child record adapters, resolver/tests | `docs/archive/plans/2026-05-16-refactor-heavy-slices.md` R1; commits `8197a13`, `d6b74af` | Supplied as protected prior work |
| Public upgrade patch resolver typing | Prior heavy-slices R2 | implemented | public detail adapter upgrade entries, full resolver, tests | `docs/archive/plans/2026-05-16-refactor-heavy-slices.md` R2; commit `223c6d1` | Supplied as protected prior work |
| Rich description token grammar dedupe | Prior heavy-slices R3 | implemented | `description-token-grammar`, `description-args`, `rich-text`, tests | `docs/archive/plans/2026-05-16-refactor-heavy-slices.md` R3; commit `0db9f80` | Supplied as protected prior work |
| Database route public catalog fixture extraction | Prior heavy-slices R9 | implemented | database routes tests, public catalog fixtures | `docs/archive/plans/2026-05-16-refactor-heavy-slices.md` R9; commit `243894c` | Supplied as protected prior work |
| Current domain/database/detail audit candidates | S1 | queued | Domain/detail/reference, database feature, rich text/reference flows | Active scout subagents | Reconcile after S1 |

## Scope Expansion Protocol

Worker slices remain bounded by `allowed_files`, but the allowed set should be large enough for the approved concept. If Worker discovers another file is required for the same approved concept, Worker must stop with `needs_scope_expansion` instead of shrinking to a tiny local patch.

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| Exclude `.worktrees` from future complexity scans or scanner invocation | Complexity script scanned old worktree files | `$refactor-learning-maintainer` / `$refactor-lint-law` | queued | Review after implementation slice; likely command hygiene note rather than product change |

## Non-goals / Protected Behavior

- No builder feature refactors.
- No collection feature refactors except direct type/test fallout from database/detail contracts.
- No broad visual redesign.
- No unrelated route/app shell changes.
- No package or lockfile changes without `$refactor-dependencies`.
- Preserve public V3 adapter compatibility and existing database detail route/modal behavior unless a behavior change is explicitly approved.

## Repo Facts

Package manager: npm (`package-lock.json`).
Stack: TypeScript, React 19, Vite, Vitest, Zod, React Testing Library.
Validation commands: targeted `vitest run --run ...`, `git diff --check`, `npm run format:check`, `npm run lint`, `npm run test:bounded`, `npm run build:quiet`.
Relevant AGENTS.md files: prompt-supplied project instructions; no nested file found by FFF.
Relevant docs/ADRs: `docs/goals/database-react-typescript-continuation/goal.md`, `docs/goals/database-broad-refactor-continuation/goal.md`, `docs/archive/plans/2026-05-16-refactor-heavy-slices.md`.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Unknown scoped area and candidate ranking | `$refactor-scout` | yes | S1 is read-only and must map concept blast radius |
| Data/detail seams, shared registries, public detail adapters/resolvers | `$refactor-architecture`, `$refactor-typescript`, `$refactor-complexity` | yes | Judge must choose concept-complete slice, not one-file patch |
| Runtime validation, schemas, unsafe casts, duplicated defensive checks | `$refactor-typescript`, `$refactor-characterization-tests` | yes | Validate at trust boundaries; preserve refined types |
| God functions/components, repeated scans, render-derived collections | `$refactor-complexity`, `$refactor-react`, `$refactor-rootfix` | yes | Scanner hints are leads, not truth |
| Modal/popover/tabs, hooks, derived state, effects | `$refactor-react` | yes | Keep public component behavior stable |
| Tailwind/CSS/a11y polish inside database/detail UI only | `$refactor-tailwind`, `$refactor-ui-a11y` | maybe | Only when it falls out of scoped files |
| Risky behavior-preserving changes with weak coverage | `$refactor-characterization-tests` | yes | Missing characterization queues a safety rail; it is not terminal by itself |
| Diff/final audit confidence | `$refactor-review` | yes | Required before claiming slice complete |

## First Tranche

Type:
- [x] read-only scout
- [ ] one bounded root-fix slice
- [ ] architecture seam cleanup
- [ ] React simplification
- [ ] TypeScript/trust-boundary cleanup
- [ ] N+1 / algorithmic hotspot cleanup

Allowed files/areas: same as intake allowed areas.
Protected files/areas: same as intake protected areas.
Expected simplification: choose after S1 scout reconciliation.
Validation: targeted tests per slice, then packet checker and diff checks.
Rollback: one commit per implemented slice where practical; revert the slice commit if validation fails after review.

## Goal Loop

### Scout

Read-only discovery. Produce ranked candidates with evidence, concept blast-radius maps, characterization needs, and maintenance candidates.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen. Prefer concept-complete root-fix slices over tiny local patches when the concept is sliceable and testable.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review`. Completion requires evidence. If any candidate register row is still `not_started`, `queued`, or `mapped`, completion must be `not_complete` and the next task should be queued.

### Maintenance

Run the relevant maintenance skill for open maintenance-register items. These tasks may be read-only proposals unless docs, AGENTS.md, lint, test-harness, or skill edits are approved.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every `active`, `done`, `blocked`, or final-audit transition must be logged in `worklog.md`.
- Scout tasks are read-only and cannot mark the goal complete.
- Judge tasks choose one next slice and cannot edit product code.
- Worker tasks edit only the approved concept slice.
- Review tasks decide `needs_fix`, `continue`, or `complete` from evidence.
- Planning is not completion.

## Root-fix vs Patch Policy

Before implementing a recurring-smell patch, run `$refactor-rootfix` and record "Why not the root fix?" unless root fix is selected.

## Dependency Policy

Any `package.json`, lockfile, dependency add/remove/update, or "use a library" choice requires `$refactor-dependencies`.

## Harness / Learning Policy

If a repeated smell is fixed, consider repo-local learning, lint/test guards, AGENTS.md routing, or skill evaluation. Record maintenance candidates separately from product refactor work.

## Receipts

Each worker slice must record:

```text
Slice:
Files changed:
What got simpler:
Behavior preserved:
Current complexity / request count:
Expected complexity / request count after:
Data size or hot-path evidence:
Root-fix/patch decision:
Dependency review needed/run:
Harness update considered:
Validation run:
Risks:
Follow-ups not done:
Learning/lint candidates:
Scope expansion requested:
```

## Characterization Policy

Before risky behavior-preserving worker slices, add or identify the smallest safety rail that pins current behavior. Use `$refactor-characterization-tests` when existing validation is weak or behavior could drift.
