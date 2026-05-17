# Refactor Goal: cross-surface-ui-normalization

## Intake

Status:
- [x] Intake completed from equivalent user decisions
- [ ] Intake skipped explicitly by user

Mode: Refactor goal workflow with Impeccable extract guidance.
Risk posture: Medium. Behavior and route semantics must be preserved; limited visual drift is allowed when it aligns Database browse, Timeline, and D-zone with the current SKeyDB design canon.
Harness update policy: Do not edit AGENTS.md or plugin skills in this tranche. Queue learning, lint-law, or harness follow-ups if repeated mistakes become machine-checkable.
Allowed areas: `src/features/database/**`, `src/pages/timeline/**`, `src/pages/d-zone/**`, `src/ui/**`, shared CSS/style files, and focused tests/docs for the approved slice.
Protected areas: Database detail modal internals unless a shared primitive already being touched requires a tiny adapter; Builder and Collection redesign work; package/dependency files; unrelated data/domain behavior.
Max worker-slice size: One concept-complete frontend normalization slice that a reviewer can understand in one pass.
Stop condition: Stop when the tranche is validated, a needed same-concept scope expansion appears, validation fails twice, or a product/design decision is needed.

## Objective

Normalize reusable frontend UI vocabulary across Database browse, Timeline, and D-zone without flattening their page-specific behavior. Extract only reusable tokens or small primitives with real migration evidence.

## Success Criteria

- Shared SKeyDB product-surface tokens exist for at least one high-reuse styling concept, such as dark panels, borders, amber focus/accent, low radius, label typography, or motion.
- At least one bounded shared primitive or token slice is implemented and migrated across two or more target surfaces.
- Database browse, Timeline, and D-zone keep their feature-specific layouts, route behavior, and data semantics.
- The candidate register explicitly tracks every user-named extraction idea as implemented, queued, blocked, out of scope by user, or superseded.
- Focused tests, lint, `git diff --check`, and browser checks cover the touched routes.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/cross-surface-ui-normalization
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| Impeccable extract/design-system normalization | queued | User requested extract guidance; PRODUCT/DESIGN identify Timeline and D-zone as canon and Database browse conventions as settled. | Scout/Judge first shared token or primitive slice. |
| Tailwind/CSS normalization | queued | Database, Timeline, and D-zone use overlapping slate/amber/radius/motion values through a mix of CSS vars, Tailwind arbitrary values, RGB, and OKLCH. | Candidate C1/C2. |
| React/component composition | queued | Timeline controls, D-zone alert switcher, and database controls repeat related product-control concepts with page-local markup. | Candidate C3/C4. |
| UI/a11y | queued | Focus, button/link semantics, reduced motion, card overlays, and custom controls must remain accessible during migration. | Include in Judge invariants and browser checks. |
| Architecture/module boundaries | queued | Need a shared UI vocabulary without making database card layout or Timeline/D-zone semantics global. | Judge must apply extraction/deletion tests. |
| Complexity hotspots | queued | Complexity scan flags `DZoneHistoryBrowser.tsx`, `BannerArtwork.tsx`, and render-derived work under database browse; many larger findings are outside this goal. | Queue C6/C7/C8 unless selected. |

## Candidate Register

The expanded S1 register is tracked in `state.json` as C1-C23. This charter table keeps the seed candidates visible while `state.json` carries the full reconciled ledger.

| Candidate | Source task | Status | Concept blast radius | Evidence | Next task or terminal reason |
|---|---|---|---|---|---|
| C1 Shared product-surface CSS tokens | S1 | implemented | `src/index.css` or shared style entry, `src/features/database/database.css`, `src/pages/timeline/timeline.css`, `src/pages/d-zone/d-zone.css` | Repeated panel, border, focus, radius, label, and motion values across all target surfaces. | Implemented in W1. |
| C2 Shared compact chip/segmented control styling | S1 | queued | `src/ui/filters/FilterChipButton.tsx`, possible new shared primitive, Timeline price filter, D-zone alert switcher, database controls | User named compact chip/segmented control; prior audit found similar controls in all three surfaces. | Needs Judge to avoid mixing different interaction semantics. |
| C3 Shared section divider/header | S1 | queued | Timeline section headers, database browse row/header areas, possible `src/ui` primitive | Timeline already has duplicate section heading shapes. | Queue unless first slice is smaller and safer. |
| C4 Shared metadata token/line | S1 | queued | Timeline event/banner metadata, database card meta/stat areas, possible `src/ui` primitive | Repeated uppercase micro-label and compact metadata rows. | Needs Scout on intent differences before extraction. |
| C5 Compact media action tile | S1 | queued | D-zone relic/monster buttons, database square-art/icon cards, `src/ui/cards` or feature adapters | Similar image well plus action target, but database hybrid cards are feature-owned. | Only implement if it does not globalize database card behavior. |
| C6 D-zone history/browser complexity cleanup | complexity scan | queued | `src/pages/d-zone/DZoneHistoryBrowser.tsx`, tests | Complexity scan flags long function, deep nesting, and repeated search in loop. | Not first token slice unless Scout shows easy root fix. |
| C7 Timeline banner artwork complexity cleanup | complexity scan | queued | `src/pages/timeline/BannerArtwork.tsx`, tests | Complexity scan flags large file, branch-heavy, effects, inline style, arbitrary classes, outline-none. | Queue for later characterization. |
| C8 Database browse render-derived work | performance scan | queued | `src/features/database/browse/EntityBrowseViews.tsx`, tests | Performance scan flags render-derived collection work. | Queue unless directly relevant to selected UI primitive. |
| C9 Neutral shared scrollbar utility | Timeline scout | implemented | `src/index.css`, Timeline drawer, D-zone history browser, shared search combobox | `.database-scrollbar` was global and consumed outside database. | Implemented in W1 with `.ui-scrollbar` and compatibility alias. |

## Scope Expansion Protocol

Worker slices remain bounded by `allowed_files`, but the allowed set must be large enough for the approved concept. If Worker discovers another file is required for the same approved concept, Worker must stop with:

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
| M1 Token usage guardrail | repeated hard-coded product-surface values | `$refactor-lint-law` | queued | Consider after first token slice proves the naming. |
| M2 Design-system documentation update | shared tokens or primitives extracted | `@impeccable document` or repo docs | queued | Update DESIGN.md or local docs if the implementation creates stable names. |

## Non-goals / Protected Behavior

- Do not redesign Builder or Collection in this goal.
- Do not normalize Database detail modal internals except for a tiny adapter around a shared primitive already selected.
- Do not add dependencies or change package files.
- Do not turn Timeline banner overlays or D-zone wave layout into generic card abstractions.
- Do not use glass/blur as default panel material. It remains text-on-art support.
- Do not overuse Droid Serif in controls, metadata, stats, taxonomy, or descriptions.

## Repo Facts

Package manager: npm.
Framework: Vite, React 19, TypeScript, Tailwind CSS v4.
Validation commands: `npm run lint`; focused `npx vitest run ...`; `git diff --check`; browser checks for `/database`, `/database/wheels`, `/database/posses` or `/database/covenants`, `/timeline`, and `/d-zone`.
Relevant AGENTS.md files: none on disk at project root; user supplied project instructions in thread.
Relevant docs/ADRs: `PRODUCT.md`, `DESIGN.md`, `docs/refactor-goals/database-browse-normalization/`.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Broad cross-page refactor goal | `$refactor-goal-prep`, `$refactor-scout`, `$refactor-worker-slice`, `$refactor-review` | yes | Goal packet is source of truth. |
| Shared UI vocabulary and page/component boundaries | `$refactor-architecture`, `$refactor-react` | yes | Use extraction/deletion tests before new primitives. |
| CSS vars, Tailwind arbitrary values, page CSS monoliths | `$refactor-tailwind` | yes | Prefer tokens and utilities where each is clearer. |
| Focus, reduced motion, controls, overflow, semantics | `$refactor-ui-a11y` | yes | Include keyboard/focus/route checks in validation. |
| Long files, repeated UI logic, render-derived work | `$refactor-complexity` | yes | Complexity scan is evidence, not marching orders. |
| Dependencies/package changes | `$refactor-dependencies` | no | Protected unless user explicitly widens scope. |
| Type/schema/trust-boundary changes | `$refactor-typescript` | no | Not primary unless selected slice touches TS contracts. |
| Repeated enforceable mistakes | `$refactor-lint-law`, `$refactor-learning-maintainer` | maybe | Queue only with concrete repeated smell evidence. |

## First Tranche

Type:
- [x] read-only scout
- [x] one bounded root-fix slice
- [ ] architecture seam cleanup
- [ ] React simplification
- [x] Tailwind/custom CSS cleanup
- [ ] TypeScript/trust-boundary cleanup
- [ ] N+1 / algorithmic hotspot cleanup
- [ ] dependency economics review
- [ ] AGENTS.md harness audit
- [ ] lint-law candidate review

Allowed files/areas: To be set by Judge after Scout. Initial intent is shared UI tokens and at most one compact primitive migration.
Protected files/areas: Package files, database detail modal internals, Builder/Collection, unrelated domain/data behavior.
Expected simplification: Fewer page-local copies of SKeyDB surface/control constants; clearer boundary between shared tokens and feature-specific layout.
Validation: Focused tests, lint, diff check, browser route checks.
Rollback: Revert selected token/primitive files and local migrations for the single Worker slice.

## Goal Loop

### Scout

Read-only discovery. Produce ranked candidates with evidence, concept blast-radius maps, characterization needs, and maintenance candidates. After every Scout report, reconcile every named candidate into the register.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review`. Completion requires evidence. If any candidate register row is still `queued`, completion is tranche-only, not full broad outcome complete.

### Maintenance

Run or queue the relevant maintenance skill for open maintenance-register items.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every `active`, `done`, `blocked`, or final-audit transition must be logged in `worklog.md`.
- Scout tasks are read-only and cannot mark the goal complete.
- Judge tasks choose one next slice and cannot edit product code.
- Worker tasks edit only the approved concept slice.
- Review tasks decide `needs_fix`, `continue`, or `complete` from evidence.
- Planning is not completion.
- Every Scout/Judge candidate must be terminally tracked as `implemented`, `queued`, `blocked`, `out_of_scope_by_user`, or `superseded`.

## Root-fix vs Patch Policy

Before implementing a recurring-smell patch, record:

```text
Why not the root fix?
```

unless the selected slice is the root fix.

## Dependency Policy

Any `package.json`, lockfile, dependency add/remove/update, or "use a library" choice requires `$refactor-dependencies`. Dependency files are protected for this tranche.

## Harness / Learning Policy

If a repeated smell is fixed, consider a queued maintenance task for docs, lint/test, or AGENTS routing. Do not bloat AGENTS.md in this tranche.

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

Before risky behavior-preserving worker slices, add or identify the smallest safety rail that pins current behavior. For token-only visual normalization, focused browser screenshots and existing route tests may be sufficient.
