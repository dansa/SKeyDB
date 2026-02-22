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

## 4) State and React Rules

1. State placement
- Local UI state stays local.
- Cross-component builder behavior goes in builder hooks/domain helpers.

2. State shape
- Avoid redundant/contradictory state.
- Store IDs/tokens, derive labels and display metadata from domain maps.

3. Effects
- Allowed: subscriptions, timers, network, imperative sync.
- Discouraged: deriving local state from props/state via Effect.

4. DnD + active selection
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

## 7) Test Strategy

1. Test behavior, not implementation details.
- Prefer user-visible assertions (`getByRole`, visible outcomes).

2. Keep tests close to ownership:
- domain tests for rule engines/codecs
- builder integration tests for user flows

3. Add regression tests for every bug fixed.
4. UI/CSS-only churn policy:
- If a change is purely presentational (styles, spacing, colors, class wiring) and does not alter behavior/state transitions, avoid adding new tests just for that churn.
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
- Final pre-commit/pre-handoff gate:
  - `npm run verify`

## 8) Pull Request / Commit Checklist

Before commit:
- [ ] behavior intent documented (issue/plan/comments)
- [ ] tests added or updated
- [ ] lint passes (`npm run lint`)
- [ ] targeted tests pass (`npm run test:unit` and/or `npm run test:integration`)
- [ ] `npm run verify` passes
- [ ] no dead code/debug flags left
- [ ] no borrowed/unlicensed data accidentally tracked

## 9) Practical "Do / Do Not"

Do:
- implement smallest valid slice
- centralize repeated UI shells
- encode invariants in domain utilities
- keep docs and plan files in sync with behavior changes

Do not:
- patch around domain bugs in UI
- store derived values that can drift
- introduce hidden behavior in effects
- refactor unrelated areas mid-feature

## 10) Research Notes (Why these rules)

These practices are aligned with patterns used by mature React/docs projects and official guidance:

- AGENTS.md in Codex context flow (how instruction files are loaded/merged):
  - https://openai.com/index/unrolling-the-codex-agent-loop/

- AGENTS.md guidance from OpenAI product docs:
  - https://openai.com/index/introducing-codex/
  - https://openai.com/business/guides-and-resources/how-openai-uses-codex/

- AGENTS.md as a concise "table of contents" that points to deeper docs (not an encyclopedia):
  - https://openai.com/index/harness-engineering/

- AGENTS.md ecosystem standard and examples:
  - https://agents.md/

- React docs: avoid unnecessary Effects and derive values during render.
  - https://react.dev/learn/you-might-not-need-an-effect
  - https://react.dev/learn/choosing-the-state-structure

- Testing Library: test from the user perspective.
  - https://testing-library.com/docs/guiding-principles

- Docusaurus: keep docs systems simple, avoid unnecessary version sprawl.
  - https://docusaurus.io/docs/versioning

- MDN Yari: separate platform code from content data sources.
  - https://github.com/mdn/yari

- Next.js contribution workflow: conventions + explicit test plan before PR.
  - https://nextjs.org/docs/community/contribution-guide

---

When in doubt:
- prefer simpler state,
- prefer domain-first rules,
- prefer tests before expansion.
