# Refactor Goal: database-browse-normalization

## Intake

Status:
- [x] Intake completed from the user's prompt and repo facts
- [ ] Intake skipped explicitly by user

Mode: Refactor goal workflow for the database landing and browse pages.
Risk posture: Moderate frontend normalization. Behavior should be preserved unless a visual polish change is directly requested by the database facelift direction.
Harness update policy: Product docs and goal packet updates are allowed. Do not change AGENTS.md, lint rules, dependencies, or plugin skills unless a concrete recurring maintenance item is identified and routed separately.
Allowed areas: `/database` landing and browse TSX, database card/filter/control helpers, database-specific CSS, reusable CSS/UI rules that are clearly shared with Timeline or D-zone.
Protected areas: Database detail modal, data models and generated data, unrelated Builder/Collection flows, dependency files unless a separate dependency review is run.
Max worker-slice size: One concept-complete frontend slice spanning producer, direct consumers, CSS, and focused tests.
Stop condition: Stop when one verified tranche lands, a product/design decision is needed, verification fails twice, or a same-concept expansion crosses the protected scope.

## Objective

Normalize the database landing and browse pages toward the newer Timeline/D-zone visual canon while reducing Tailwind/CSS bloat, React component friction, and UI/a11y drift.

## Success Criteria

- Database landing and browse pages preserve current behavior and tests.
- At least one bounded cleanup slice materially reduces duplicated or monolithic styling.
- Text-on-art glass treatments remain purposeful and database-specific behavior stays aligned with Impeccable guidance.
- Detail modal remains untouched.
- Scout findings are tracked as implemented, queued, blocked, out of scope, or superseded.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/database-browse-normalization
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| Tailwind/CSS normalization | not_started | User called out index CSS monolith, D-zone/Timeline page CSS, and database browse styles. | Scout current CSS ownership and pick one bounded slice. |
| React component simplification | not_started | User named `$refactor-react`; database browse uses shared layout, cards, filter rows, and controls. | Scout component seams and duplicated presentation responsibilities. |
| UI/a11y polish | not_started | User named `$refactor-ui-a11y`; database browse has tabs, filters, cards, search, sort, and responsive views. | Scout labels, focus, overflow, keyboard, empty/loading states, and visual checks. |
| Impeccable design alignment | not_started | PRODUCT/DESIGN set Timeline/D-zone as current canon and restrict glass/Droid Serif. | Cross-check against product register and browser screenshots. |
| Detail modal | out_of_scope_by_user | User explicitly said the actual DB details modal is out of scope. | Do not touch in this pass. |

Terminal statuses:
- `implemented`
- `blocked`
- `out_of_scope_by_user`
- `superseded`

Non-terminal statuses:
- `not_started`
- `queued`
- `mapped`

## Candidate Register

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| Move database poster-card CSS out of `src/index.css` into a database page stylesheet or shared artwork-overlay rule | S1 | not_started | `src/index.css`, database route/page imports, database card frame CSS, tests/visual checks | Recent glass overlay landed in global CSS; Timeline and D-zone already use page-specific CSS files. | Scout and judge whether database-specific CSS or shared artwork overlay primitive is the root fix. |
| Normalize database browse controls/card layout class strings | S1 | not_started | Database browse layout, filter rows, sort/search controls, active filter chips | Prompt asks for less CSS bloat and frontend normalization. | Scout repeated Tailwind patterns and decide one slice. |
| Audit card/button accessibility and focus after poster overlay changes | S1 | not_started | Database card frame, browse cards, filter/search/sort controls | UI/a11y focus area named; glass overlays can affect readable contrast and focus. | Scout before worker slice. |

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

Judge should then widen the allowed file set or record a concrete blocker.

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| Database CSS ownership rule | repeated global CSS growth | `$refactor-learning-maintainer` or `$refactor-lint-law` | not_started | Consider only if Scout finds repeated page CSS drifting into `src/index.css`. |

## Non-goals / Protected Behavior

- Do not refactor the database detail modal.
- Do not change domain data, generated artifacts, or data semantics.
- Do not redesign Builder or Collection in this goal.
- Do not add dependencies.
- Do not convert all page CSS into utilities if custom CSS remains clearer for responsive/card-mode rules.

## Repo Facts

Package manager: npm with `package-lock.json`.
Stack: Vite, React 19, TypeScript, Tailwind CSS v4, Vitest, ESLint.
Validation commands: `npx prettier --check ...`, `npx vitest run src/features/database/DatabaseRoutes.test.tsx`, `npm run lint`, `git diff --check`, plus browser visual checks for `/#/database` and `/#/database/wheels`.
Relevant AGENTS.md files: no root file present on disk; current thread supplied AGENTS instructions requiring FFF for discovery and low-reasoning subagents for scouting/coding.
Relevant docs/ADRs: `PRODUCT.md`, `DESIGN.md`, archived `docs/archive/refactor-goals/database-detail-audit/`.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Broad multi-file frontend cleanup | `$refactor-goal-prep`, `$refactor-scout`, `$refactor-worker-slice`, `$refactor-review` | yes | Keep packet state authoritative. |
| Tailwind classes, global CSS, page-specific CSS, arbitrary values | `$refactor-tailwind` | yes | Prefer utilities/components, but keep custom CSS for responsive card-mode rules when clearer. |
| React/Vite/TSX components and composition | `$refactor-react` | yes | Preserve public behavior and avoid new hooks/state unless justified. |
| Accessibility, focus, keyboard, layout overflow, copy | `$refactor-ui-a11y` | yes | Verify controls and card overlays visually and semantically. |
| Local patch versus recurring global CSS ownership smell | `$refactor-rootfix` | yes | Decide page stylesheet versus shared reusable rule before implementation. |
| Dependencies | `$refactor-dependencies` | no | No dependency changes approved or needed. |
| TypeScript trust-boundary validation | `$refactor-typescript` | no | Detail/data semantics are out of scope unless Scout finds a direct UI type smell. |

## First Tranche

Type:
- [x] read-only scout
- [x] one bounded root-fix slice
- [ ] architecture seam cleanup
- [x] React simplification
- [x] Tailwind/custom CSS cleanup
- [ ] TypeScript/trust-boundary cleanup
- [ ] N+1 / algorithmic hotspot cleanup
- [ ] dependency economics review
- [ ] AGENTS.md harness audit
- [ ] lint-law candidate review

Allowed files/areas: `src/features/database/**`, `src/ui/**` only when directly consumed by database browse, `src/index.css`, database or shared CSS imports, focused tests/docs.
Protected files/areas: `src/features/database/*Detail*`, modal internals, generated data, dependency files.
Expected simplification: Move page-specific browse CSS out of the global monolith where useful, reduce repeated class/CSS concepts, and clarify component ownership.
Validation: Prettier, focused database tests, lint, browser visual checks, `git diff --check`, refactor goal checker.
Rollback: Revert the tranche files from the working tree while preserving goal packet audit notes.

## Goal Loop

### Scout

Read-only discovery. Produce ranked candidates with evidence, concept blast-radius maps, characterization needs, and maintenance candidates.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review`. Completion requires evidence. If any candidate register row is still `not_started`, `queued`, or `mapped`, completion must be `not_complete` and the next task should be queued.

### Maintenance

Run the relevant maintenance skill for open maintenance-register items only when repeated smells deserve durable repo rules.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every `active`, `done`, `blocked`, or final-audit transition must be logged in `worklog.md`.
- Scout tasks are read-only and cannot mark the goal complete.
- Judge tasks choose one next slice and cannot edit product code.
- Worker tasks edit only the approved concept slice.
- Review tasks decide `needs_fix`, `continue`, or `complete` from evidence.
- Planning is not completion.

## Root-fix vs Patch Policy

Before implementing a recurring-smell patch, run `$refactor-rootfix`.

## Dependency Policy

Any `package.json`, lockfile, dependency add/remove/update, or library choice requires `$refactor-dependencies`.

## Harness / Learning Policy

If a repeated smell is fixed, consider `docs/ai/refactor-discipline/learnings.md`, `docs/ai/refactor-discipline/smell-ledger.md`, AGENTS.md routing via `$refactor-agents-md`, or lint/test via `$refactor-lint-law`.

## Receipts

Each worker slice must record:

```text
Slice:
Files changed:
What got simpler:
Behavior preserved:
Current complexity / request count:
Expected complexity / request count after:
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

Before risky behavior-preserving worker slices, add or identify the smallest safety rail that pins current behavior. The current first tranche is visual/CSS ownership cleanup covered by database route tests and browser screenshots.
