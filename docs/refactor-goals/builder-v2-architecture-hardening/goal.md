# Refactor Goal: builder-v2-architecture-hardening

## Intake

Status:
- [x] Intake completed from the user's explicit `$refactor-goal-prep` request, current Builder V2 baseline, local complexity scans, and five read-only scouts.
- [ ] Intake skipped explicitly by user.

Mode: Refactor goal workflow for Builder V2 architecture/code-health hardening after the committed baseline `1ab19b79`.
Risk posture: Preserve current `/builder-v2` behavior and all `/builder` behavior. Prefer root-fix slices when behavior can be characterized, but stop before product/design/DnD feature decisions.
Harness update policy: This goal packet may be updated. Add focused characterization tests with implementation slices. Do not change AGENTS.md, lint rules, dependencies, plugin skills, or remote state without a routed maintenance task and explicit approval.
Allowed areas: `src/features/builder-v2/**`, focused Builder V2 tests, narrowly related `src/features/builder/types.ts` and `src/features/builder/team-state.ts` only when the chosen concept requires shared type/result cleanup, read-only references to V1 builder tests/helpers, and this goal packet.
Protected areas: current `/builder` UI behavior, unrelated pages, generated/domain data, builder persistence key/version/migrations unless a Judge explicitly selects the persistence-boundary candidate, dependency files, remote state, `docs/design/**`, temporary screenshots.
Max worker-slice size: One concept-complete slice spanning producer, direct consumers, focused tests, and direct shared helper/type files needed for that concept. Do not shrink a same-concept fix to avoid touching a necessary direct consumer.
Stop condition: Stop when the active tranche lands and is verified, a product/design decision is needed, verification fails twice on the same blocker, same-concept expansion crosses protected scope, or work drifts into mobile redesign, teams-list shape, or DnD feature implementation.

## Objective

Harden Builder V2 internals after the first functional baseline by reducing the real complexity in `useBuilderV2Model.ts` and adjacent Builder V2 surfaces. The goal is not to perform extraction for its own sake; it is to create clearer state/command/projection boundaries so future dnd-kit work, drag ghosts based on builder cards/picker content, and continued UI polish do not pile on top of one 2k-line hook.

## Success Criteria

- `useBuilderV2Model.ts` stops being the sole owner of preferences, projections, picker option queries, loadout assignment, transfer orchestration, and layout-facing state.
- Assignment behavior is characterized before risky refactors: duplicate/transfer paths, same-team wheel swaps, covenant/noop behavior, posse transfers, quick-lineup advancement, and selection restoration.
- The first implementation tranche creates or prepares a typed Builder V2 editing/loadout command boundary that can later accept click, keyboard, and DnD/drop inputs without duplicating handler trees.
- Current `/builder-v2` UI behavior, focus behavior covered by tests, quick-lineup behavior, transfer dialogs, import/export behavior, and picker ordering remain stable unless a later Judge explicitly approves a behavior change.
- CSS/a11y issues discovered by scouts are tracked and not silently dropped, but they do not expand the first tranche into visual redesign, mobile view work, or teams-list decisions.
- Zustand/Immer is evaluated as a candidate only if evidence shows it removes real state/command complexity; no dependency or state-library churn without `$refactor-dependencies` and explicit approval.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-architecture-hardening
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| TypeScript/model invariants | mapped | TypeScript scout found broad `ActiveSelection`, broad wheel indexes, invalid editing-mode combinations, and storage envelope cast concerns. | Queue selection/editing-mode and wheel-index candidates; persistence parsing is tracked but outside first tranche unless selected. |
| React model/hook boundaries | mapped | React and complexity scouts found `useBuilderV2Model.ts` still owns persistence, projections, picker queries, assignments, transfers, dialogs, and import/export wiring. | First tranche should characterize and then split a command/projection boundary. |
| Tailwind/CSS contracts | mapped | CSS scout found duplicated rail/button styling, incomplete focus/motion contracts, clipping risks, and picker grid sizing split across contexts. | Queue CSS hardening candidates after core command boundary or as a separate Worker slice. |
| UI/a11y hardening | mapped | UI/a11y scout found duplicate picker IDs, incomplete picker tile accessible names, adaptive drawer focus issues, reduced-motion gaps, and fixed picker grid overflow risk. | Queue shared picker a11y and adaptive focus candidates; do not merge with command-boundary slice unless needed by same concept. |
| Complexity/root-fix | mapped | Complexity audit reports `useBuilderV2Model.ts` at 1980 LOC, max hook body about 1652 lines, 341 rough branches, 11 effects. Complexity scout prioritizes loadout command resolver and explicit team-state results. | Active task S1 reconciles scouts; next Judge should pick characterization-first loadout command boundary. |
| DnD future-readiness | mapped | Scouts agree current assignment handlers and slot DTO shape would multiply future dnd-kit/drop/drag-ghost handler paths. | Keep DnD implementation out of this goal until command/target boundaries are ready. |
| Zustand/Immer state strategy | mapped | User asked whether there is a point; current evidence says state is complex, but no scout proved a dependency/state-library shift is the root fix. | Queue as review-only candidate; dependency/state-library changes require `$refactor-dependencies` and explicit approval. |

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
| C1: Assignment behavior characterization | S1 scouts | implemented | `src/features/builder-v2/useBuilderV2Model.test.ts`, possibly `BuilderV2Page.test.tsx` | Complexity scout recommended characterization before loadout command refactor: duplicate transfer, same-team wheel swap, cross-team wheel transfer, covenant swap/noop, posse transfer, quick-lineup advancement, selection after assignment. | Implemented by W1 with focused assignment behavior tests. |
| C2: Builder V2 loadout command resolver | TypeScript/React/complexity scouts | implemented | `useBuilderV2Model.ts`, new V2 loadout command module, `BuilderV2ModelTypes.ts`, focused tests, direct consumers of assignment results | `assignAwakener`, `assignWheel`, `assignCovenant`, and `assignPosse` repeat target resolution, transfer branching, mutation, target clearing, picker tab setting, quick-lineup advancement, and selection restoration. | Implemented by W2 with `builder-v2-loadout-commands.ts`; hook now applies resolved outcomes. |
| C3: V2 selection/editing-mode boundary | TypeScript scouts | implemented | `BuilderV2ModelTypes.ts`, `useBuilderV2Model.ts`, selection helper module, focused model/page tests | `activeSelection`, `activeTeamTarget`, and `pickerTab` are independent fields for one editing mode and can drift into impossible states. Selection can also reference non-existent slots. | Implemented by W3 with local `builder-v2-editing-mode` helper and focused tests. |
| C4: Shared `WheelSlotIndex` type | TypeScript scouts | implemented | `src/features/builder/types.ts`, V2 model/types, quick-lineup/DnD data types, focused V1/V2 tests | Shared `QuickLineupStep`, `ActiveSelection`, and `WheelUsageLocation` use `number`; V2 clamps malformed values to `1`. | Implemented by W8 with shared `WheelSlotIndex`, typed V1/V2 wheel-index boundaries, and raw-number guards at UI/DnD ingress points. |
| C5: Explicit team-state operation result | Complexity scouts | queued | `src/features/builder/team-state.ts`, V1/V2 callers, team-state tests, V2 model tests | Callers use `result.nextSlots === activeTeamSlots` as noop control flow. | Good root-fix candidate after command-boundary characterization; may need adapter to avoid V1 churn. |
| C6: Pure picker option query modules | React/complexity scouts | implemented | `useBuilderV2Model.ts`, new picker query module(s), `BuilderV2ModelTypes.ts`, focused model tests | Four picker option pipelines are large `useMemo` blocks coupled to hook state and hard to test directly. | Implemented by W4 with `builder-v2-picker-options.ts`; hook retains inactive-tab gates and pure tests cover status/recommendation contracts. |
| C7: Stable action groups / adaptive callback churn | React scouts | implemented | `useBuilderV2Model.ts`, `BuilderV2Page.tsx`, `BuilderV2AdaptiveLayout.tsx`, focused page tests | Desktop wraps assignment callbacks with `useStableEvent`; adaptive callbacks close over the entire `model`. | Implemented by W7 with a shared Builder V2 `useStableEvent` hook and stable adaptive picker open/assignment callbacks. |
| C8: Slot interaction descriptors for drag ghosts | React/complexity scouts | queued | `BuilderV2ModelTypes.ts`, `useBuilderV2Model.ts`, `BuilderV2TeamSlots.tsx`, focused page tests | `BuilderV2SlotView` is a render DTO containing labels/assets/selection, not stable interaction descriptors. | Queue as DnD-prep after C2/C3. Do not implement DnD here. |
| C9: Shared picker a11y hardening | UI/a11y scouts | implemented | `BuilderV2AwakenerPicker.tsx`, `BuilderV2Page.test.tsx`, maybe CSS | Shared picker content reuses fixed DOM IDs across desktop and adaptive instances; tile `aria-label`s omit blocked/unowned/recommended/active statuses. | Implemented by W5 with instance-safe picker IDs, same-instance tab focus, and richer tile accessible names. |
| C10: Adaptive drawer focus containment/restore | UI/a11y scouts | implemented | `BuilderV2AdaptiveLayout.tsx`, focused page tests | Assignment close path suppresses focus restore; focus trap lacks outside-activeElement fallback. | Implemented by W6 with opener-aware focus restore and document-level Tab containment for the adaptive picker drawer. |
| C11: Builder V2 motion/focus CSS contract | CSS/UI scouts | implemented | `builder-v2.css`, Browser visual checks, focused a11y/manual checks | Reduced motion only covers drawer animations; focus styles are partly global and partly bespoke. | Implemented by W9 with Builder V2-local focus ring tokens and scoped reduced-motion handling for picker/backdrop/card-art motion. |
| C12: Rail/button CSS dedupe | CSS scouts | implemented | `builder-v2.css`, `BuilderV2Page.tsx`, `BuilderV2AdaptiveLayout.tsx` only if class names change | Desktop/adaptive rail buttons and button recipes duplicate nearly identical styles. | Implemented by W11 as CSS-only shared selectors for desktop/adaptive rail buttons and primary picker/lineup button styles. |
| C13: Clipping/drag overlay CSS boundary | CSS scouts | queued | `builder-v2.css`, maybe future drag overlay root | `.builder-v2-panel` and cards use clipping for both panel containment and art masks, which can clip future drag ghosts/focus halos. | Queue before DnD implementation; do not add DnD here. |
| C14: Picker grid sizing contract | CSS/UI scouts | implemented | `builder-v2.css`, Browser checks, page tests if needed | Desktop picker uses fixed 4-column tracks while adaptive/mobile override via ancestor selectors. | Implemented by W9 with a shared picker results grid sizing contract across desktop, adaptive, and mobile picker shells. |
| C15: Persistence envelope parser | TypeScript scout | implemented | `src/features/builder/builder-persistence.ts`, migrations tests | `JSON.parse(raw) as PersistedBuilderEnvelope` casts before envelope validation. | Implemented by W10 with a runtime envelope parser for current and legacy builder draft storage before payload validation. |
| C16: Zustand/Immer state strategy review | User prompt | queued | Read-only review of `builderDraftStore`, `useBuilderV2Model`, command candidates, dependency policy | Current evidence does not prove a state-library/dependency shift is needed. | Judge/review-only candidate after C2/C3; dependency changes require approval. |

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

Judge should then widen the allowed file set or record a concrete blocker. Do not shrink to a tiny patch just to avoid a same-concept direct consumer.

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| M1: Repeated broad-model callback churn pattern | React/complexity scouts | `$refactor-learning-maintainer` or `$refactor-lint-law` | queued | Consider after C2/C7 whether a local lesson or lintable review rule would prevent wide `model` dependencies in Builder V2 layouts. |
| M2: CSS focus/motion contract drift | CSS/UI scouts | `$refactor-learning-maintainer` or `$refactor-lint-law` | queued | Consider after C11 whether a documented Builder V2 CSS contract or lint/test guard is useful. |

## Non-goals / Protected Behavior

- Do not implement DnD/dnd-kit behavior in this goal-prep tranche.
- Do not redesign mobile views.
- Do not decide teams list vs cards or build share-card presentation.
- Do not touch temp screenshots or `docs/design/**`.
- Do not change dependencies or adopt Zustand/Immer differently without `$refactor-dependencies` and explicit approval.
- Do not change `/builder` visible behavior.
- Do not use extraction for line-count optics when the old call sites still need the same hidden knowledge.

## Repo Facts

Package manager: npm with `package-lock.json`.
Stack: Vite, React 19, TypeScript 6, Tailwind CSS v4, Vitest, ESLint, Zustand, Immer installed, dnd-kit installed.
Current baseline commit: `1ab19b79 Builder V2 core builder baseline`.
Current untracked files: Builder V2 temporary screenshots and `docs/design/`; keep out of this goal unless explicitly selected.
Local complexity scan evidence: `useBuilderV2Model.ts` remains the highest repo hotspot, about 1980 LOC after type extraction, max function body about 1652 lines, 341 rough branches, 11 effects. Other Builder V2 hotspots include `BuilderV2AdaptiveLayout.tsx`, `BuilderV2MobileLayout.tsx`, `BuilderV2AwakenerPicker.tsx`, and `BuilderV2TeamSlots.tsx`.
Validation commands: targeted Builder V2 Vitest suites, focused shared builder helper tests when touched, `npx tsc -p tsconfig.app.json --noEmit`, targeted `npx eslint ...`, and Browser/manual checks for CSS/a11y slices.
Relevant AGENTS.md instructions: prefer FFF MCP when available, do not close subagents before completion, prefer configured `scout`/`coder`/`web` presets, no remote state without explicit permission.
Relevant docs/ADRs: `DESIGN.md`, `PRODUCT.md`, `docs/refactor-goals/builder-v2-rebuild/**`, `docs/design/**` as read-only design context.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Explicit goal workflow request | `$refactor-goal-prep` | yes | This packet is the durable source of truth. |
| God hook, branch-heavy model, repeated assignment pipelines | `$refactor-complexity`, `$refactor-rootfix`, `$refactor-react` | yes | Prefer behavior-preserving root-fix slices over line-moving. |
| Broad selection/wheel types, invalid states, DOM/storage parsing | `$refactor-typescript` | yes | Validate at boundaries and preserve refined types. |
| React hooks/callback churn/projection coupling | `$refactor-react` | yes | Reduce hook responsibilities and wide `model` dependencies. |
| CSS duplication, focus/motion/clipping/grid contracts | `$refactor-tailwind` | yes | Keep visual behavior stable; use Browser/manual checks when CSS changes. |
| Picker ids/names, dialog focus, reduced motion | `$refactor-ui-a11y` | yes | Keep controls semantic and test focus where practical. |
| Risky behavior-preserving refactors | `$refactor-characterization-tests` | yes | Characterize before C2/C3/C5. |
| Dependency/state-library strategy | `$refactor-dependencies` | maybe later | Required before dependency or state-library changes. |
| Repeated workflow/code smells | `$refactor-learning-maintainer`, `$refactor-lint-law` | maybe later | Maintenance only after implementation evidence. |

## First Tranche

Type:
- [x] read-only scout
- [ ] one bounded root-fix slice
- [ ] architecture seam cleanup
- [ ] React simplification
- [ ] Tailwind/custom CSS cleanup
- [ ] TypeScript/trust-boundary cleanup
- [ ] algorithmic hotspot cleanup
- [ ] dependency economics review
- [ ] AGENTS.md harness audit
- [ ] lint-law candidate review

Allowed files/areas for likely next Judge/Worker: `src/features/builder-v2/useBuilderV2Model.ts`, `src/features/builder-v2/BuilderV2ModelTypes.ts`, new local Builder V2 command/selection helper modules, `src/features/builder-v2/useBuilderV2Model.test.ts`, `src/features/builder-v2/BuilderV2Page.test.tsx`, `src/features/builder-v2/builder-v2-usage-index.test.ts`.
Protected files/areas: mobile redesign, teams-list shape decisions, DnD implementation, `/builder` visible behavior, temp screenshots, `docs/design/**`, dependencies.
Expected simplification: first implement characterization and then a typed loadout/editing command boundary that deletes repeated assignment/post-assignment branching from `useBuilderV2Model.ts` while preserving the existing model contract.
Validation: `npx vitest run src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx src/features/builder-v2/builder-v2-usage-index.test.ts --run`, `npx tsc -p tsconfig.app.json --noEmit`, targeted eslint.
Rollback: revert the local command/selection helper module(s), tests, and `useBuilderV2Model.ts` integration changes.

## Goal Loop

### Scout

Read-only discovery. S1 collected TypeScript, React, CSS, UI/a11y, and complexity/root-fix scout reports plus local complexity/performance scans. Future Scout tasks should be narrow and only reopen unknown areas.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix or patch was chosen. For the likely next task, Judge should decide whether C1 and C2 are one tranche or whether C1 must land first as pure characterization.

### Worker

Implement only the chosen slice. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion` instead of shrinking to a tiny local patch.

### Review

Run `$refactor-review` over diff, receipts, candidate register, and validation. Completion requires evidence. If any candidate register row is still `queued` or `mapped`, the broad goal remains active with queued follow-ups.

### Maintenance

Run relevant maintenance skills only for maintenance-register items after implementation evidence shows the pattern is recurring and worth encoding.

## Root-Fix Decision

Symptom: Builder V2 now works, but its model remains a 2k-line hook that owns unrelated reasons to change and would make DnD/drag ghosts another layer of handler branching.

Likely root cause: the first functional baseline intentionally concentrated state, projections, commands, and dialogs in `useBuilderV2Model.ts` to get product behavior online. That was useful for bootstrapping, but the boundary now hides assignment, selection, transfer, and picker-close semantics from future input sources.

Local patch:
- Agent effort: low.
- Human effort: low now, higher later.
- Behavior risk: low per patch.
- Future complexity: high.
- Recurrence risk: high.

Root fix:
- Agent effort: medium/high but sliceable.
- Human effort: medium.
- Behavior risk: medium, controlled by characterization.
- Future complexity: lower.
- Recurrence risk: lower.
- Concepts deleted: per-assignment duplicated target/cleanup/picker-close logic, UI-local assignment outcome inference, broad invalid selection states.
- Concepts added: typed V2 command/target/result boundary and/or explicit editing mode.
- Rewrite simpler than patching: yes for assignment/selection semantics; no for full hook split in one Worker.
- Can be sliced: yes, characterization -> command boundary -> projection/picker split.
- Can be tested: yes, current Builder V2 model/page tests already cover much of the behavior.
- Rollback: revert the selected Worker files.
- Concept blast radius: V2 model/types/tests first; shared builder types/helpers only if Judge selects C4/C5/C15.
- Scope expansion needed: not for C1/C2/C3; yes if selecting shared builder type/result or persistence candidates.

Recommendation: characterization first, then root-fix slice for C2 loadout command resolver and C3 editing/selection boundary.

Current tranche decision: W1 implemented C1 Assignment behavior characterization, W2 implemented C2 Builder V2 loadout command resolver extraction, W3 implemented C3 editing-target boundary, and W4 implemented C6 picker query extraction. J5 is active to choose the next contained post-picker-extraction slice.

## Dependency / Zustand / Immer Policy

`zustand` and `immer` are already installed, but this goal does not authorize state-library redesign. If a future Judge believes a store slice, Immer reducer, or dependency-level state strategy is the root fix, it must first produce a `$refactor-dependencies` review with:

- current state complexity evidence,
- why command/result boundaries are insufficient,
- migration blast radius,
- validation plan,
- rollback plan,
- explicit user approval requirement.

## Harness / Learning Policy

If this goal repeatedly uncovers the same agent mistake, for example wide `model` dependencies or CSS motion/focus drift, queue a maintenance task rather than hiding the lesson in a final summary.
