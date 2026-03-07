# SKeyDB Agent Guide

This file is for coding agents working in this repo.
Its job is to reduce churn, keep logic in the right layer, and preserve repo-specific behavior.

## 1) Instruction Order

1. Highest priority:
- system, developer, runtime, and tool constraints

2. Repo policy:
- this `AGENTS.md` is the repo-level instruction source

3. Context+ workflow:
- if a local `INSTRUCTIONS.md` file is present, treat it as supplemental guidance for Context+ MCP usage
- use it only when Context+ is available and relevant to the task
- do not assume other maintainers have that file or the same local MCP and Ollama setup
- apply its principles where they fit this repo; do not import server-specific formatting rules blindly

4. Task direction:
- user requests define the task
- they do not override higher-priority safety or runtime constraints

5. Fallback:
- if Context+ is unavailable or bound to the wrong root, fall back to repo-safe local tooling
- if `INSTRUCTIONS.md` is absent, ignore it and continue with this file plus the active runtime rules
- verify MCP state before trusting Context+ output again

## 2) Repo Priorities

1. Correctness first:
- this is a data-heavy React + TypeScript app
- domain correctness, deterministic codecs, and maintainability matter more than rapid UI churn

2. Domain-first ownership:
- fix domain problems in `src/domain/*`, not with UI patches
- UI should consume domain outputs, not recreate business rules

3. Low-churn execution:
- make the smallest safe change that satisfies the task
- avoid unrelated rewrites, cleanup sprees, or speculative abstractions

4. Visual consistency:
- preserve the sharp, squared, Morimens-inspired visual language
- do not introduce a new visual pattern without a clear reason

## 3) Ownership Boundaries

1. File ownership:
- `src/domain/*`: business rules, codecs, normalization, validation, comparators, shared utilities
- `src/pages/builder/*`: orchestration, page-level state, builder view-model logic
- `src/pages/collection/*`: collection ownership state, export pipeline, collection view-model logic
- `src/components/ui/*`: reusable UI primitives
- `src/data/*`: canonical static data with stable IDs

2. State rules:
- derive instead of duplicating state
- keep state minimal
- store stable IDs or tokens, then derive labels and display metadata

3. Effect rules:
- use effects for external synchronization only
- do not use effects for pure data transforms that can be derived during render

4. Interaction ownership:
- DnD, move, swap, clear, and validity rules belong in domain helpers where possible
- reusable interaction semantics should not be reimplemented page-by-page

5. Sorting ownership:
- shared ordering policy belongs in domain comparators
- page code may assemble sortable fields, but should not duplicate comparator policy

6. Storage ownership:
- use the existing `safeStorageRead`/`safeStorageWrite` abstractions in `src/domain/storage.ts`
- do not use raw `window.localStorage` or `window.sessionStorage` directly

7. Shared utility ownership:
- if a pure function (search normalization, clamping, validation, config resolution) is needed by more than one page or module, it belongs in `src/domain/*`
- before writing or inlining a utility, check whether one already exists in domain

## 4) Agent Workflow

1. Before non-trivial behavior changes:
- define the intended behavior in a short list of inputs, outputs, invariants, and edge cases
- decide file ownership before coding

2. Prefer test-first changes:
- add or update a failing test before implementation for behavior changes and bug fixes
- keep tests close to the owning layer

3. Implement in thin slices:
- write the smallest passing change first
- refactor only after behavior is green
- no "while I am here" rewrites unless required for the task

4. For cleanup or QC passes:
- scan the whole requested scope before editing
- produce a compact findings list mentally or explicitly
- fix the batch, then verify the batch

5. For large UI reworks:
- phase A: extract reusable shells or primitives without behavior changes
- phase B: migrate layout into those shells with handlers and state unchanged
- phase C: add new behavior

6. Styling-only passes:
- keep them styling-only
- if interaction semantics, accessibility, or state flow changes, treat it as behavior work and add regression coverage

## 5) Code-Shape Preferences

1. Keep logic easy to scan:
- inline tiny single-use logic
- extract repeated or conceptually meaningful logic
- split files before they exceed ~500 lines; treat 700+ as a strong signal to extract
- for React files: separate pure logic (config, transforms, batch operations) from hook/component code when both are substantial

2. Keep structure shallow:
- avoid deep nesting
- prefer straightforward control flow over layered indirection

3. Comments:
- use comments sparingly
- add a short comment only when intent is not obvious from the code
- do not mass-introduce mandatory file header comments across the repo
- for a new non-trivial module, a short top-of-file summary is acceptable if it materially improves navigation and does not conflict with local file conventions

4. Hygiene:
- remove unused imports, dead variables, and dead branches in touched code
- do not leave debug-only code behind

5. Extraction quality bar:
- new components must own state, effects, or meaningful derivation, or be a distinct visual zone with a narrow interface
- new hooks must own state, effects, or refs — not just bundle unrelated derived values
- if an extraction requires passing through most of the parent's props or state, it probably does not improve ownership
- apply the delete test: if deleting the extraction and inlining the code back would not make the parent worse, the extraction was artificial

6. Deduplication:
- never copy-paste a pure function across files; extract to a shared location on first reuse
- when adding a utility, search `src/domain/` for existing equivalents before creating a new one
- page-specific wrappers around shared utilities are fine, but the core logic must not be duplicated

## 6) Data and Codec Rules

1. Stable identity:
- never rely on array order as identity
- IDs and schema contracts are stable boundaries

2. Boundary normalization:
- normalize invalid states at the boundary
- example: an empty awakener slot must not retain wheels

3. Import/export safety:
- treat codec changes as high-risk
- preserve deterministic output
- keep strict decode validation and explicit errors
- add round-trip tests and size-sensitive assertions when relevant

4. Versioning:
- preserve the prefix strategy such as `t1.` and `mt1.` unless the task explicitly changes versioning

5. Canonical data maintenance:
- use the packaged sync commands when changing canonical IDs or exported tables
- `npm run data:sync-awakener-ids`
- `npm run data:sync-posse-indices`
- `npm run data:sync-wheel-data`

## 7) Testing and Verification

1. Test behavior, not implementation details:
- prefer user-visible assertions and domain outputs

2. Regression coverage:
- every bug fix should add or update a regression test

3. Scope-matched verification:
- unit or domain work: `npm run lint` and `npm run test:unit`
- builder interaction work: `npm run lint` and `npm run test:integration`
- collection or smaller UI regression work: `npm run lint` and `npm run test:quick`

4. Final gate:
- run `npm run verify` before claiming substantial work is complete

## 8) Documentation Workflow

1. Use the right doc type:
- `docs/roadmap.md`: current priorities only
- `docs/backlog.md`: unscheduled ideas worth keeping
- `docs/plans/`: active implementation plans only
- `docs/notes/`: durable design notes, migration notes, and status/reference docs
- `docs/archive/`: shipped or superseded history

2. Prefer current docs over historical docs:
- update `docs/roadmap.md` and `docs/backlog.md` instead of editing archived snapshots
- link to notes or archive files when history matters; do not treat them as the current source of truth

3. When to create a plan:
- create or update a plan in `docs/plans/` for multi-step implementation work, non-trivial migrations, or work expected to span multiple sessions
- do not create a dated plan for tiny one-shot edits unless the user asks for it

4. Plan format:
- start from `docs/templates/plan-template.md`
- keep the required execution-oriented header used by the repo's planning workflow
- include explicit scope, out-of-scope, verification, and task slices

5. Active plan maintenance:
- keep `Status` accurate: `Draft`, `In progress`, `Blocked`, or `Done`
- update `Last updated` when a meaningful session changes the plan state
- keep `Progress Snapshot` honest; remove stale blockers and stale “in progress” text
- if implementation diverges materially from the written plan, patch the plan instead of leaving it misleading

6. Notes:
- start from `docs/templates/note-template.md`
- use notes for durable reasoning, findings, and status/reference material that future plans should link to
- notes should not become unchecked task dumps

7. Closing the loop:
- when active work ships, is abandoned, or is superseded, move the plan to `docs/archive/plans/`
- if priorities changed, update `docs/roadmap.md` or `docs/backlog.md` in the same pass
- if a note is now the canonical explanation for a subsystem, make sure related plans link to it instead of repeating the same context

## 9) Context+ Usage

1. Default behavior:
- if present, use local `INSTRUCTIONS.md` as the primary guide for Context+ tool choice and ordering
- prefer structural discovery over broad file reads

2. High-value Context+ usage:
- use context tree or file skeleton views to scope work
- use blast radius before deleting or heavily reshaping shared symbols
- run static analysis after edits when the tool is available and appropriate

3. Editing:
- prefer `propose_commit` when it is available and compatible with the active environment
- if the environment requires a different edit mechanism, follow the environment without treating that as a repo policy violation

## 10) Agent-Specific Non-Goals

1. This file is not a human maintainer handbook:
- keep human process prose, long checklists, and broad contributor policy elsewhere

2. Do not preserve historical process bloat just because it already exists:
- keep this file lean, repo-specific, and useful during execution

3. When in doubt:
- prefer simpler state
- prefer domain-first fixes
- prefer tests before expansion
