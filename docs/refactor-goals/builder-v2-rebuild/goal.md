# Refactor Goal: builder-v2-rebuild

## Intake

Status:
- [x] Intake completed from the user's prompt, branch archaeology, and six read-only scouts.
- [ ] Intake skipped explicitly by user.

Mode: Refactor goal workflow for a ground-up Builder V2 page.
Risk posture: Preserve existing `/builder` behavior strictly. Builder V2 may introduce new visible UX only on `/builder-v2`, with product/design uncertainty stopping the slice.
Harness update policy: Product docs and this goal packet may be updated. Do not change AGENTS.md, lint rules, dependencies, or plugin skills without a routed maintenance task and explicit approval.
Allowed areas: `src/features/builder-v2/**`, focused tests for Builder V2, `src/App.tsx` route wiring, read-only references to `src/features/builder/**`, `src/stores/builderDraftStore.ts`, `docs/design/**`, and `builder/mobile-ux`.
Protected areas: current `/builder` route behavior, `src/features/builder/BuilderPage.tsx` as the V1 shell, builder persistence key/version, migrations, domain/generated data, dependency files, remote state, and unrelated pages.
Max worker-slice size: One concept-complete slice spanning producer, direct consumers, focused tests, and route glue.
Validation commands: `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx`, `npm run test:integration`, targeted builder helper tests when contracts are touched, `npm run lint`, `npm run build`.
Stop condition: Stop when the active tranche lands and is verified, a product/design decision is needed, verification fails twice on the same blocker, same-concept expansion crosses the protected scope, or the work starts drifting into a rushed partial shipment rather than healthy local groundwork.

Additional user constraints recorded 2026-05-22:
- Use the concept images as first-class input, especially `docs/design/Desktop.png`, `docs/design/Mobile.png`, and `docs/design/Mobile-QuickLineup.png`.
- Treat this as long-running local work, possibly a week or more. Do not optimize for shipping in small public increments.
- Commit in meaningful chunks when useful, with `--no-verify` acceptable for experimental local checkpoints if needed. Do not push or open remote PRs without explicit permission.
- Keep `docs/design` mockups and sendoff unstaged unless they are intentionally selected for a later PR.
- The product intent is known: Builder wants to assemble and manage Morimens teams. The root fix is healthier architecture and a UI/UX that makes that workflow feel obvious.

## Objective

Create a new Builder V2 surface from the ground up, using current builder data contracts and logic helpers while rejecting the old builder UI as the foundation. The new page should become the working shell for future design passes: barebones, responsive-aware, functionally honest, and easy for a design-focused model to restyle without rebuilding product logic.

The broad destination is a designer handoff: a healthy local Builder V2 page, backed by tests and explicit workflow constraints, that lets a design-focused model or UI designer concentrate on making the experience feel excellent instead of rediscovering builder rules, current code debt, or missing interaction states.

## Success Criteria

- `/builder` remains untouched and covered by existing integration tests.
- `/builder-v2` exists as a separate lazy route and does not appear in app navigation until intentionally promoted.
- Builder V2 uses current public-id based contracts, `builderDraftStore`, current migrations/persistence, and existing pure helper behavior.
- The first tranche renders the active team, four slots, a minimal picker, and supports assigning/removing awakeners through current helper logic.
- The first tranche includes V2-specific outcome tests rather than copying current DOM-coupled BuilderPage tests.
- Visual treatment is intentionally barebones but aligned with the newer D-Zone/Timeline/database language: sharp panels, compact controls, amber state, restrained blue.
- The first tranche visibly acknowledges the concept images through its structural arrangement, even if polish, final artwork treatment, and mobile app flow are deferred.
- The old `builder/mobile-ux` branch is used for flow evidence only, not as a merge or direct store/persistence source.
- The final local outcome is handoff-ready: core builder interactions exist in V2, unresolved product choices are named, concept-image alignment is traceable, and the remaining design freedom is clear rather than hidden inside old Builder debt.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-rebuild
```

after editing packet files.

## Root-Fix Decision

Symptom: The current Builder is a monolithic, visually stale, debt-heavy UI where behavior, layout measurement, dialogs, picker, DnD, teams, and styling are tangled.

Likely root cause: Builder grew as one page-level integration surface. Its UI components are shaped around the old visual language and current DOM rather than a clean builder workflow model.

Local patch: Restyle or lightly rearrange current BuilderPage.
- Agent effort: medium.
- Human effort: low now, high later.
- Behavior risk: medium, because style/layout edits touch the protected production builder.
- Future complexity: high.
- Recurrence risk: high.

Root fix: Add a new Builder V2 feature folder and route that consumes current builder contracts through a thin interface, then rebuild layout and flow around the actual workflow.
- Agent effort: high but sliceable.
- Human effort: lower than a manual rewrite because tests and helper contracts already exist.
- Behavior risk: controlled by keeping `/builder` protected and validating helper contracts.
- Future complexity: lower if V2 separates model/actions from layout surfaces.
- Recurrence risk: lower.
- Concepts deleted: current page as design foundation, old branch store/persistence, name-keyed v2 branch assumptions, old blue builder visual vocabulary.
- Concepts added: Builder V2 shell, thin model facade, explicit desktop/tablet/mobile layout surfaces.
- Rewrite simpler than patching: yes.
- Can be sliced: yes.
- Can be tested: yes, through existing helper tests plus V2 outcome tests.
- Rollback: remove `/builder-v2` route and `src/features/builder-v2/**`.
- Concept blast radius: new feature folder, route glue, focused tests, current helper imports.
- Scope expansion needed: yes, across tranches; each Worker remains one concept.

Recommendation: refactor goal with characterization-first V2 harness slices.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| New route and feature boundary | implemented | W1 added a lazy `/builder-v2` route in `src/App.tsx` and kept Builder V2 out of navigation. | Keep unpromoted until a later product/design decision. |
| Current builder contract reuse | implemented | W1 added `useBuilderV2Model` as a facade over `builderDraftStore`, persistence, ownership hydration, search helpers, and `team-state` assignment/removal helpers. W2 extended it to gear/posse assignment, W3 wired quick-lineup, W4 wired mobile drawer orchestration, W6 wired import/export, W7 wired transfer confirmation, and W8 wired team management. | Terminal for this goal; DnD and recommendations are future UX-mechanics slices after the designer pass. |
| Old UX branch flow salvage | implemented | W4/R4 implemented the concept-image mobile overview, focused builder, and full-screen picker drawer flow while keeping `builder/mobile-ux` as reference only. | Terminal for this goal; do not migrate old branch code into Builder V2. |
| Test/characterization harness | implemented | W1-W8 added focused V2 model/page characterization for assignments, gear/posse, quick-lineup, mobile drawer focus, adaptive routing, import/export, transfer confirmations, and team management while keeping relevant V1 contract tests green. | Terminal for this goal; add focused characterization with any future UX mechanics slice. |
| Concept image alignment | implemented | W1 follows `Desktop.png` anatomy, W3 implemented the quick-lineup contract, W4 implemented `Mobile.png`-style overview/focused/full-screen picker states, W5 added the pseudo-desktop adaptive shell, and C9 names the selected concept images as the designer target. | Terminal for this goal; final visual interpretation belongs to the designer pass. |
| Visual baseline | implemented | W1 added local Builder V2 CSS with sharp panels, compact controls, restrained blue, amber selection, and D-Zone-style UI tokens. C9 reframes this as product baseline, not final visual destination. | Terminal for this goal; the designer pass owns final visual polish toward the selected mockups. |
| Teams section polish | implemented | W8/R8 implemented functional team management across desktop, adaptive, and mobile: add, switch, rename, reset/delete confirmations, D-Tide templates, and accessible reorder. | Final cards/list/share presentation is a designer/future-day decision, not a functional blocker. |
| DnD/import/export/quick-lineup polish | implemented | W3/R3 implemented quick-lineup, W6/R6 implemented import/export parity, and W7/R7 implemented transfer dialog parity. User clarified DnD and recommendations should wait until the visual direction is good. | Terminal for this goal; DnD/recommendations are future UX-mechanics slices after the designer pass. |
| Designer handoff readiness | implemented | C9 added `designer-handoff.md` plus current baseline screenshots and a pasteable designer prompt that frames `/builder-v2` as product baseline and the selected mockups as the target. | Terminal for this goal. |

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
| C1: Builder V2 route and bare draft loop shell | S1 | implemented | `src/App.tsx`, `src/features/builder-v2/**`, focused V2 tests, read-only current builder helpers | W1 added `src/features/builder-v2` and a lazy `/builder-v2` route without nav promotion. | Terminal for this goal. |
| C2: Thin Builder V2 model facade over current store/helpers | S1 | implemented | `src/features/builder-v2/useBuilderV2Model.ts`, current helper imports, focused tests | W1 implemented `useBuilderV2Model` with current draft store hydration/autosave and `team-state` assignment/removal helpers; later slices extended it for the selected Builder V2 workflows. | Terminal for this goal; DnD/recommendations remain future mechanics. |
| C3: Minimal V2 picker surface | S1 | implemented | `src/features/builder-v2/*Picker*`, search/filter prefs, current domain search/sort helpers | W1 added `BuilderV2AwakenerPicker`; W2 broadened picker behavior to wheels, covenants, and posses. | Terminal for this goal. |
| C3a: Concept-image-informed V2 shell anatomy | User follow-up | implemented | V2 shell/layout CSS, desktop team rail/stage/armory zones, mobile/quick-lineup boundary notes | W1 implemented the desktop rail/stage/armory/overview shell, W4 implemented mobile concept flow, W5 implemented adaptive concept flow, and C9 names the concept images as the designer target. | Terminal for this goal. |
| C4: Gear and posse assignment | S1 | implemented | V2 slot loadout UI, wheel/covenant/posse action helpers, transfer dialogs | W2 added Armory tabs for Awakeners/Wheels/Covenants/Posses, actionable W1/W2/Covenant and team Posse targets, assign/clear behavior, same-active-team gear movement, cross-team duplicate blocking, and focused tests. W7 added transfer dialogs. | Terminal for this goal; DnD/recommendations are future UX-mechanics slices. |
| C5: Mobile overview/focused/picker drawer flow | UX branch scout | implemented | V2 mobile layout files, drawer/focus management, focused slot UI tests | W4/R4 implemented mobile overview, focused builder, full-screen picker drawer states, drawer focus management, Escape/focus return, and mobile quick-lineup focused-slot synchronization. | Terminal for this goal. |
| C6: Quick Lineup V2 mode | UX/tests scouts | implemented | V2 quick-lineup UI, current `quick-lineup.ts`, store quick-lineup state, tests | W3 enabled Builder V2 Quick Lineup mode using existing `builderDraftStore` quick-lineup actions, compact V2 controls, assignment-driven step advance, manual target jump, cancel restore, final posse completion, and focused model/page tests. | Terminal for this goal. |
| C7: Teams overview redesign | User prompt | implemented | V2 teams surface, team-management helpers, screenshot/share needs | W8/R8 implemented functional team management parity in a visually provisional surface. User clarified final team list/cards shape can be deferred. | Terminal for this goal; final list/cards/share presentation belongs to designer/future polish. |
| C8: Import/export and transfer parity | Contract/test scouts | implemented | V2 dialogs, import/export hooks, transfer confirm hooks, tests | W6/R6 implemented import/export parity and W7/R7 implemented transfer dialog parity across desktop/adaptive/mobile/quick-lineup flows. | Terminal for this goal; DnD/recommendations are future UX-mechanics slices. |
| C9: Designer handoff bundle | User clarification | implemented | Goal packet, Browser-plugin screenshots/browser smoke evidence, current `/builder-v2` notes, concept-image traceability, unresolved visual/layout decisions | C9 added `designer-handoff.md`, current baseline screenshots, explicit concept-image target framing, and a pasteable designer prompt. | Terminal for this goal. |

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
| Builder V2 contract docs | successful first tranche | `$refactor-learning-maintainer` | superseded | Superseded for this local rebuild by the goal packet plus `designer-handoff.md`; add dedicated contract docs only if Builder V2 is promoted later. |
| Builder visual vocabulary drift guard | repeated old-builder CSS/class reuse | `$refactor-lint-law` or `$refactor-learning-maintainer` | out_of_scope_by_user | No repeated drift guard or AGENTS/lint update was required during W1-W9; visual vocabulary guidance is captured in `designer-handoff.md` and existing `DESIGN.md`/`PRODUCT.md`. |

## Non-goals / Protected Behavior

- Do not merge `builder/mobile-ux`.
- Do not replace `/builder` in this goal's first tranche.
- Do not treat the first local slices as public shipping increments.
- Do not add Builder V2 to nav until the page is useful enough for users or testing requires it.
- Do not redesign the teams section beyond minimal switching/visibility until the list-vs-cards decision is made.
- Do not add dependencies.
- Do not change persistence key/version, migrations, generated domain data, or import/export codecs unless a later Judge explicitly approves that concept.
- Do not use old Builder components as the V2 visual foundation.

## Repo Facts

Package manager: npm with `package-lock.json`.
Stack: Vite, React 19, TypeScript, Tailwind CSS v4, Vitest, ESLint, Zustand, dnd-kit.
Validation commands: `npm run test:integration`, targeted V2 and builder helper vitest commands, `npm run lint`, `npm run build`, full `npm run verify` before promotion.
Relevant AGENTS.md files: current thread supplied project instructions requiring FFF for discovery when available, read-only subagent boundaries, and no remote mutations without explicit permission.
Relevant docs/ADRs: `DESIGN.md`, `PRODUCT.md`, `docs/design/oracle-sendoff.md`, `docs/design/Desktop.png`, `docs/design/Mobile.png`, `docs/design/Mobile-QuickLineup.png`, prior `docs/refactor-goals/**`.
Relevant branch evidence: `builder/mobile-ux` contains old `src/pages/builder/v2/**` flow experiments but uses old data/store/persistence assumptions.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Broad multi-file root-fix rebuild | `$refactor-intake`, `$refactor-goal-prep`, `$refactor-rootfix`, `$refactor-scout` | yes | Keep packet state authoritative. |
| React/Vite/TSX state/components | `$refactor-react`, `$refactor-architecture` | yes | Split model facade from layout. |
| UI accessibility, focus, drawers, responsive layout | `$refactor-ui-a11y` | yes | Required for mobile drawer/focused flows and picker controls. |
| Tailwind/CSS/global visual vocabulary | `$refactor-tailwind` | yes | Keep V2 CSS local/minimal and aligned with DESIGN/PRODUCT. |
| Current behavior is risky to preserve | `$refactor-characterization-tests` | yes | Add V2 outcome tests and rely on existing helper tests. |
| Type/id trust boundaries and migrations | `$refactor-typescript` | yes | Avoid name-keyed state and unsafe direct persistence. |
| God component/root complexity | `$refactor-complexity`, `$refactor-rootfix` | yes | Do not patch current BuilderPage; build a new boundary. |
| Dependencies | `$refactor-dependencies` | no | No dependency changes approved or needed. |
| Harness/lint/learning updates | `$refactor-learning-maintainer`, `$refactor-lint-law`, `$refactor-agents-md` | maybe | Propose only if repeated drift appears. |

## First Tranche

Type:
- [ ] read-only scout
- [x] one bounded root-fix slice
- [x] architecture seam setup
- [x] React state/interface setup
- [x] Tailwind/custom CSS baseline
- [x] TypeScript/trust-boundary preservation
- [x] characterization tests
- [ ] dependency economics review
- [ ] AGENTS.md harness audit
- [ ] lint-law candidate review

Allowed files/areas for likely first Worker: `src/App.tsx`, `src/features/builder-v2/BuilderV2Page.tsx`, `src/features/builder-v2/BuilderV2Page.test.tsx`, `src/features/builder-v2/useBuilderV2Model.ts`, small local V2 components/CSS if needed.
Protected files/areas: `src/features/builder/BuilderPage.tsx`, existing `src/features/builder/BuilderPage*.test.tsx` except read-only reference, persistence key/version/migrations, generated data, dependency files.
Expected simplification: The first V2 surface should prove the builder can be operated from a small current-code facade without using the current BuilderPage UI as the foundation, while its shell anatomy clearly points toward the selected desktop concept image.
Validation: focused V2 tests, current builder integration suite, lint, build.
Rollback: delete `src/features/builder-v2/**` and remove the lazy route from `src/App.tsx`.

## Goal Loop

### Scout

Read-only discovery. Six scouts have already mapped contracts, old branch flow, tests, styling anchors, route integration, and core interaction risks. Future Scout tasks should be narrow and only reopen unknown areas.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen. Prefer concept-complete root-fix slices over tiny local patches when the concept is sliceable and testable.

### Worker

Implement only the chosen slice. Record receipt. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review`. Completion requires evidence. If any candidate register row is still `not_started`, `queued`, or `mapped`, completion must be `not_complete` and the next task should be queued.

### Maintenance

Run the relevant maintenance skill only for concrete repeated smells, harness drift, or enforceable mistakes.

## Local State Rules

- Exactly zero or one `state.json` task may be `active`.
- Every `active`, `done`, `blocked`, or final-audit transition must be logged in `worklog.md`.
- Scout tasks are read-only and cannot mark the goal complete.
- Judge tasks choose one next slice and cannot edit product code.
- Worker tasks edit only the approved concept slice.
- Review tasks decide `needs_fix`, `continue`, or `complete` from evidence.
- Planning is not completion.
- Every Scout/Judge candidate must be terminally tracked as `implemented`, `queued`, `blocked`, `out_of_scope_by_user`, or `superseded`.

## Characterization Policy

Before risky behavior-preserving Worker slices, add or identify the smallest safety rail that pins current behavior. For Builder V2, prefer V2 outcome tests over current DOM-coupled BuilderPage tests, and keep the existing pure helper/store tests green.

## Receipts

Each Worker slice must record:

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
