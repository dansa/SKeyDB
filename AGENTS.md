# SKeyDB Agent Playbook (Draft)

This file is the working guide for humans and coding agents in this repo.
Goal: ship features without the "write fast, refactor for an hour" loop.

## 1) Project Intent

SKeyDB is a React + TypeScript builder app with data-heavy behavior:
- domain rules (team validity, uniqueness constraints)
- picker/search behavior
- deterministic import/export codecs
- Morimens-inspired UI

This is not a "just build UI quickly" repo. Correctness and maintainability are first-order requirements.

## 2) Core Engineering Principles

1. Derive, do not duplicate:
- Prefer derived values over duplicated state.
- Keep state as minimal as possible.

2. Keep effects for external sync only:
- Do not use Effects for pure data transforms that can be derived during render.
- If you are calling setState in an Effect, challenge that design first.

3. Split by ownership boundaries:
- `src/domain/*`: business rules, codecs, normalization, validation.
- `src/pages/builder/*`: feature orchestration/view-model/hooks.
- `src/components/ui/*`: reusable UI primitives.
- `src/data/*`: canonical static datasets with stable IDs.

4. One source of truth per concern:
- IDs and schema contracts live in domain/data.
- UI reads domain outputs; UI should not re-implement domain rules.

5. Small, verified iterations:
- Add tests first for behavior changes.
- Ship in vertical slices with passing lint/tests/build.

## 3) Anti-Churn Workflow (Required)

Use this flow for any non-trivial feature:

1. Define behavior first (5-10 bullets max)
- Inputs, outputs, invariants, edge cases.
- If data contract changes, write the schema shape first.

2. Decide file ownership before coding
- Where does this logic belong (domain/hook/UI)?
- If you cannot answer in one sentence, stop and design.

3. Write failing tests first
- Domain logic: unit tests near domain files.
- Builder interactions: integration tests in `BuilderPage.test.tsx` or hook tests.

4. Implement the minimum passing slice
- No speculative abstractions.
- No "while I am here" rewrites unless required to pass tests.

5. Refactor immediately after green
- Extract only repeated structure (for example modal shell, button variants).
- Keep behavior identical; prove with tests.

6. Run gates before marking done
- `npm run lint`
- targeted tests
- `npm run verify` before final handoff/commit

## 3.1) QC Pass Protocol (Required)

When doing a cleanup/code-quality pass (especially on broad feature scopes):

1. Full scan first, no edits:
- Review the entire requested scope end-to-end before changing code.
- Do not patch the first issue immediately.

2. Findings list:
- Write a compact findings list grouped by severity.
- Include file ownership/placement concerns, not only bugs.

3. Fix plan:
- Create a short fix plan that addresses all findings in one batch.
- Confirm no out-of-scope churn is included.

4. Batch implementation:
- Apply fixes only after the full scan + plan is complete.
- Avoid partial "one issue fixed so we are done" exits.

5. Verify after batch:
- Run targeted tests for touched areas.
- Run `npm run lint`, then `npm run verify` before completion claims.

## 3.2) UI Rework Protocol (Required)

When reworking large UI surfaces (for example `CollectionPage`):

1. Phase-gate the work:
- Phase A: introduce reusable shells/primitives only (no behavior changes).
- Phase B: migrate page layout into shells (handlers/state unchanged).
- Phase C: add new behavior/features.

2. Keep the page shippable at each phase:
- Avoid one-shot rewrites of large files.
- Preserve compile + lint + targeted tests after each phase.

3. Styling-only passes must stay styling-only:
- If a pass is declared visual/CSS-only, do not change interaction/state logic.
- If behavior must change, explicitly call it out and add regression tests.

## 3.3) Process Scope Rule (Required)

1. Multi-file behavior changes:
- Use the full process (`3`, `3.1`, and verification gates).

2. Isolated CSS-only tweaks:
- Use a lightweight flow (small patch + `npm run lint` + targeted visual/behavior sanity checks).
- Escalate to full process if state/interaction semantics change.

## 4) State and React Rules

1. State placement
- Local UI state stays local.
- Cross-component builder behavior goes in builder hooks/domain helpers.

2. State shape
- Avoid redundant/contradictory state.
- Store IDs/tokens, derive labels and display metadata from domain maps.

3. DnD + active selection
- Domain utilities own move/swap/clear rules.
- UI triggers intents; domain returns next valid state.

## 5) Component Rules

1. Extract reusable primitives when duplication appears 3+ times.
- Example already done: `ModalFrame`, `Button`.

2. Do not create "god components".
- If component mixes orchestration + rendering + domain transforms, split it.

3. Keep UI components dumb where possible.
- Behavior orchestration in hooks/view-model.
- Styling consistency through shared primitives/utility classes.

4. Preserve visual language.
- Sharp/squared Morimens-like styling.
- Avoid introducing new visual patterns without a clear reason.

## 5.1) Interaction Contract Rules

1. Define interaction semantics before implementation:
- For wheel/hover/modifier/click-swallow behavior, lock expected UX contract first (for example `Shift+wheel` vs plain wheel).

2. Avoid timing-coupled interaction logic:
- Prefer explicit state/context or scoped DOM checks over event-loop timing hacks when preventing accidental toggles.

3. Keep reusable vs local ownership explicit:
- If a rule applies across multiple entity types (awakeners/wheels/posses), implement in shared domain/UI primitives, not page-local branches.

## 6) Data and Codec Rules

1. IDs are stable contracts.
- Never rely on array order as identity.
- Prefer explicit IDs/indexes with tests for uniqueness.

2. Normalize invalid states at boundaries.
- Example: empty awakener slot must not carry wheels.

3. Import/export changes are high-risk.
- Keep deterministic output.
- Keep strict decode validation and explicit errors.
- Add round-trip tests and size assertions.

4. Version strategy
- Prefix-based versioning (`t1.`, `mt1.`) is required for future evolution.

5. Repo sync scripts are boundary tools, not ad hoc fixes.
- Use the packaged sync commands when canonical data IDs or exported data tables change:
- `npm run data:sync-awakener-ids`
- `npm run data:sync-posse-indices`
- `npm run data:sync-wheel-data`
- If a data maintenance script exists without an npm entry point, add a TODO instead of standardizing a direct invocation here.

## 6.1) Sorting and Ordering Ownership

1. Shared ordering policy belongs in domain comparators.
- Priority/tiebreak rules (owned/unowned, rarity, faction, index) must live in `src/domain/*` comparators.

2. Page/view-model code should only assemble sortable fields.
- Do not duplicate comparator policy in page hooks unless strictly temporary and documented.

## 7) Test Strategy

1. Test behavior, not implementation details.
- Prefer user-visible assertions (`getByRole`, visible outcomes).

2. Keep tests close to ownership:
- domain tests for rule engines/codecs
- builder integration tests for user flows

3. Add regression tests for every bug fixed.
4. UI/CSS-only churn policy:
- Follow section 3.2 for styling-only passes and behavior-boundary expectations.
- Add or update tests when UI changes affect interaction contracts, accessibility semantics, state flow, or domain behavior.

5. Keep tests readable:
- one behavior per test name
- avoid giant fixture mutation blocks without explanation

6. Use scope-matched test commands:
- Unit/domain/hook churn:
  - `npm run lint`
  - `npm run test:unit`
- Builder integration churn:
  - `npm run lint`
  - `npm run test:integration`
- Collection/small UI regression churn:
  - `npm run lint`
  - `npm run test:quick`
- Final pre-commit/pre-handoff gate:
  - `npm run verify`

7. Stateful UX flows must test transition points:
- For freeze/apply flows, assert both pre-apply and post-apply behavior.
- For edit-mode interactions, assert mode-enter, in-mode behavior, and mode-exit outcomes.

## 8) Pull Request / Commit Checklist

Before commit:
- [ ] behavior intent documented (issue/plan/comments)
- [ ] tests added or updated
- [ ] lint passes (`npm run lint`)
- [ ] targeted tests pass (`npm run test:unit` and/or `npm run test:integration`)
- [ ] `npm run verify` passes
- [ ] remember `pre-commit` also runs `npm run verify`; do not rely on the hook as the first signal
- [ ] no dead code/debug flags left
- [ ] no borrowed/unlicensed data accidentally tracked

## 9) Practical "Do / Do Not"

Do:
- implement smallest valid slice
- keep docs and plan files in sync with behavior changes

Do not:
- patch around domain bugs in UI
- refactor unrelated areas mid-feature

---

When in doubt:
- prefer simpler state,
- prefer domain-first rules,
- prefer tests before expansion.

