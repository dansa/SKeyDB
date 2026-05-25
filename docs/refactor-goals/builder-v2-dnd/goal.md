# Refactor Goal: builder-v2-dnd

## Intake

Status:
- [x] Intake completed from the user's explicit request to start Builder V2 DnD with Refactor Discipline, subagent scouts, and a cleaner architecture than V1's multiple ghost/object systems.
- [ ] Intake skipped explicitly by user.

Mode: Refactor goal workflow for Builder V2 drag-and-drop.
Risk posture: Preserve current `/builder-v2` click/tap assignment behavior and current `/builder` behavior. Use V1 DnD as behavior reference, not code-shape authority. Prefer typed contracts and characterization before wiring dnd-kit.
Harness update policy: This goal packet may be updated. Add focused tests and Browser/manual receipts with implementation slices. Do not change AGENTS.md, lint rules, dependencies, plugin skills, remote state, or `docs/design/**` without routed maintenance and explicit approval.
Allowed areas: `src/features/builder-v2/**`, focused Builder V2 tests, read-only V1 builder DnD references under `src/features/builder/**`, narrowly related shared builder helpers/types only when selected by Judge, and this goal packet.
Protected areas: `/builder` visible behavior, mobile redesign, teams-list shape decisions, unrelated pages, generated/domain data, dependencies, remote state, `docs/design/**`, temporary screenshots, and speculative DnD abstractions without a selected payload/preview/drop contract.
Max worker-slice size: One DnD concept-complete slice spanning producer, direct consumers, tests, and CSS only when the concept requires it. Do not mix payload contracts, event routing, overlay visuals, and full behavior wiring unless Judge explicitly approves that combined slice.
Stop condition: Stop when the active tranche lands and is verified, a product/design decision is needed, verification fails twice on the same blocker, same-concept expansion crosses protected scope, or work drifts into mobile redesign, teams-list shape, dependency churn, or V1 rewrites.

## Objective

Build Builder V2 DnD from a clean contract instead of copying V1's accumulated drag ghost/object sprawl. The first architectural goal is a single typed understanding of drag payloads, drop targets, preview descriptors, and overlay requirements that can support picker items, active team slots, wheels, covenants, posse assignment, quick-lineup, transfer dialogs, and future drag ghosts without parallel one-off systems.

## Success Criteria

- Builder V2 has a typed drag payload and drop target contract that is independent of rendered labels, component class names, and accidental picker/card DTO structure.
- V1 behavior parity is explicitly tracked: picker awakeners/wheels/covenants/posses, active slot/wheel/covenant moves, remove-to-picker, card-level wheel/covenant fallback targeting, duplicate/transfer dialogs, quick-lineup advancement, and remove-intent feedback.
- Drag preview/ghost work uses one descriptor/overlay path for picker and card sources rather than separate picker object, card object, picker ghost, and card ghost data models.
- Assignment execution stays routed through existing Builder V2 model/command boundaries unless Judge selects a direct command expansion slice.
- Desktop and adaptive/tablet are first-class validation targets. Mobile remains out of scope unless explicitly selected later.
- No dependency changes are made unless `$refactor-dependencies` is run and approved.

## Packet Files

This local Refactor Discipline goal uses:

- `goal.md`: this charter and policy.
- `state.json`: machine-checkable task state and receipts.
- `worklog.md`: chronological human log of decisions, commands, validation, and commits.

Run:

```text
node C:\Users\dansa\.codex\plugins\cache\refactor-discipline-local\refactor-discipline\0.4.3\skills\refactor-goal-prep\scripts\check-refactor-goal.mjs --goal docs/refactor-goals/builder-v2-dnd
```

after editing packet files.

## Focus Area Coverage

| Focus area | Status | Evidence | Next task or terminal reason |
|---|---|---|---|
| V1 DnD behavior parity | mapped | Scouts mapped V1 `DndContext`, `useBuilderDnd`, typed `DragData`, drop-zone IDs, predicted hover, transfer actions, quick-lineup behavior, and tests. | Queue characterization/parity tests before behavior-heavy V2 wiring. |
| V2 drag payload and drop target contract | mapped | Builder V2 has no dnd-kit integration yet; slot/picker DTOs contain enough IDs/assets/status, but are render-focused. | First likely Worker slice: V2-owned payload, preview descriptor, and drop target descriptor module/tests. |
| Drag preview and ghost architecture | mapped | V1 has separate picker ghosts, team card ghosts, team wheel ghosts, and team preview ghosts; user explicitly wants to avoid this sprawl. | Queue one preview descriptor/overlay contract before visual ghost implementation. |
| DnD event routing and model commands | mapped | V2 assignment commands handle picker assignment but not active-team slot/wheel/covenant drag moves/removal as first-class model APIs. | Queue command characterization/expansion before team-origin drags. |
| CSS overlay, clipping, and z-index boundary | mapped | Architecture C13 found V2 panels/cards/picker art clip; scouts recommend portal overlay above panels/drawers. | Queue after the first concrete overlay DOM exists; do not guess CSS without a ghost surface. |
| Desktop/adaptive pointer behavior | mapped | V2 desktop has side picker; adaptive has drawer picker. Scouts recommend desktop and tablet pointer/manual checks. | Validate every DnD worker slice on desktop/adaptive surfaces once browser wiring exists. |
| A11y and keyboard DnD | mapped | V1 uses PointerSensor only; no KeyboardSensor. V2 click assignment remains the non-pointer fallback today. | Queue explicit a11y decision: keyboard DnD now, or documented non-pointer alternatives plus future candidate. |

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
| D1: V2 drag payload, preview, and drop target descriptor contract | S1 scouts, architecture C8 | implemented | `BuilderV2ModelTypes.ts`, new V2 DnD contract/helper module, `useBuilderV2Model.ts`, `builder-v2-picker-options.ts`, focused tests | Current `BuilderV2SlotView` and picker options are render DTOs. V1 `DragData` is useful behavior reference but should not be copied with V1 ghost coupling. | W1 added `src/features/builder-v2/builder-v2-dnd.ts` and focused tests. No dnd-kit wiring yet. |
| D2: V2 DnD id helpers and drop target parsing | S1 scouts | implemented | New V2 `dnd-ids` helper, descriptor tests, direct consumers when wired | V1 uses plain slot IDs plus prefixed wheel/covenant/picker/team-preview IDs. V2 needs stable IDs without leaking V1 preview/team-row concerns. | W1 added V2-prefixed id builders/parser with colon-safe wheel ids and rejection tests. |
| D3: V1 parity characterization for DnD routing | S1 scouts | implemented | V1 DnD tests read-only baseline, new V2 pure routing tests once helpers exist | V1 behavior includes picker-to-card fallback, socket-specific wheels/covenants, remove-to-picker, transfer dialogs, quick-lineup advancement. | W2 added pure routing characterization in `builder-v2-dnd.test.ts`. Command-level characterization can expand with D6 team-origin moves. |
| D4: Picker draggable source wiring | S1 scouts | implemented | `BuilderV2AwakenerPicker.tsx`, D1 contracts, focused page tests | Picker tiles render all draggable source candidates and already preserve click assignment. | W3 implemented picker draggables for awakeners/wheels/covenants/posses. |
| D5: Active slot/wheel/covenant target and source wiring | S1 scouts, architecture C8 | implemented | `BuilderV2TeamSlots.tsx`, slot descriptors, D1/D2 contracts, page tests | Team slots render card, wheel, and covenant interaction surfaces but had no stable drag/drop descriptors. | W3 implemented slot/wheel/covenant/posse droppables; W4/W6 completed team-origin drag sources, move/remove execution, and hover/remove feedback. |
| D6: Builder V2 DnD event coordinator and model command expansion | S1 scouts | implemented | New V2 DnD hook/coordinator, `useBuilderV2Model.ts`, `builder-v2-loadout-commands.ts`, model/page tests | V2 had picker assignment commands, but team-origin slot/wheel/covenant moves and remove-to-picker needed explicit command paths. | W4 implemented team-origin drags, remove actions, and explicit move commands through model boundaries. |
| D7: Single Builder V2 drag overlay and ghost descriptor renderer | S1 scouts | implemented | New overlay/ghost component, D1 preview descriptor, `BuilderV2Page.tsx`, `builder-v2.css`, visual/browser checks | V1 ghost system is visually useful but data-model messy. User wants one clean preview path. | W5 implemented one descriptor-driven Builder V2 drag overlay; W7 refined descriptor variants without importing V1 ghost components. |
| D8: Overlay clipping/z-index CSS boundary | Architecture C13, S1 scouts | implemented | `builder-v2.css`, overlay component/root if selected, Browser checks | V2 slot cards, art masks, picker results, and adaptive drawer use clipping and fixed layers. | W5 added overlay CSS above adaptive picker layers. |
| D9: Remove-intent and predicted hover feedback | S1 scouts | implemented | V2 DnD hook/coordinator, slot descriptors, `BuilderV2TeamSlots.tsx`, CSS, tests/browser checks | V1 remove-intent and predicted wheel/covenant hover prevent ambiguous drops. | W6 implemented picker remove-target styling, direct slot/wheel/covenant drop-target styling, pointer-first collision, and card-level wheel/covenant fallback drops. |
| D10: Keyboard/a11y DnD decision and fallback | S1 a11y scout | implemented | DnD hook sensors, picker/slot components, page tests/manual SR notes | V1 uses PointerSensor only; V2 must avoid pretending pointer DnD is fully keyboard-accessible. | J2 selected click-first fallback policy for now: pointer DnD is progressive enhancement and existing click buttons remain the required non-pointer path. |
| D11: Team row/team list DnD | S1 scouts | out_of_scope_by_user | Teams rail/list/card surfaces | User has not settled teams-list/card shape; current request focuses core builder DnD. | Out of scope until teams section shape is selected. |
| D12: Mobile DnD | User scope | out_of_scope_by_user | Mobile layout and picker shell | User previously asked to leave mobile for later; current DnD validation targets desktop/adaptive. | Out of scope until explicitly selected. |
| D13: Whole-slot awakener and loadout swap | User reported issue | implemented | `builder-v2-dnd.ts`, loadout/model commands, DnD hook, focused tests | V2 could replace slot content but not drag an entire occupied awakener slot with its loadout onto another slot. | W6 implemented `move-awakener` over `swapSlotAssignments`. |
| D14: Picker remove drop zone | User reported issue | implemented | `BuilderV2AwakenerPicker.tsx`, `builder-v2.css`, Browser validation | V2 had remove actions but no picker surface registered as the remove target. | W6 registered picker results as the picker drop target and added remove-target styling. |
| D15: Pointer-first target correctness | User reported issue | implemented | `useBuilderV2Dnd.ts`, `BuilderV2Page.tsx`, Browser validation | Dense picker/card grids could resolve a drop by rectangle center rather than the cursor-visible target. | W6 wired `pointerWithin` with `closestCenter` fallback into desktop/adaptive `DndContext`. |
| D16: V1-aligned compact ghost polish | User screenshots | implemented | `BuilderV2DragOverlay.tsx`, `builder-v2.css`, DnD descriptor tests | V2 ghosts were too slabby and text-heavy compared with the tighter V1 intent. | W7 made picker/content ghosts art-only with thin picker chrome and whole-slot drags compact full-art slot-card ghosts through descriptor `variant`. |
| D17: Predicted effective drop hover | User requested V1-style prediction | implemented | `builder-v2-dnd.ts`, `useBuilderV2Dnd.ts`, Builder V2 active/picker components, focused DnD tests | Literal DOM hover could light the wrong surface, such as covenant-over-wheel lighting a wheel or broad wheel drops implying replacement. | W8 added a pure effective-target resolver shared by hover and final drop routing: wheels broad-fill only first empty sockets, full card wheel drops no-op, covenants resolve to the owning covenant slot. |

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

Judge should widen the allowed file set or record a concrete blocker. Do not shrink a DnD boundary to a tiny local patch if direct consumers must change together.

## Maintenance Register

| Candidate | Trigger | Skill | Status | Next task or reason |
|---|---|---|---|---|
| M1: DnD accessibility policy | V1 PointerSensor-only behavior and V2 future DnD | `$refactor-ui-a11y`, maybe `$refactor-learning-maintainer` | queued | After first DnD wiring, decide whether to encode a local accessibility note or test pattern. |
| M2: Drag preview descriptor pattern | User explicitly wants to avoid ghost/object sprawl | `$refactor-learning-maintainer` | queued | Consider after D7 if the descriptor pattern should be recorded for future builder surfaces. |

## Non-goals / Protected Behavior

- Do not rewrite V1 builder DnD.
- Do not change `/builder` visible behavior.
- Do not redesign mobile or implement mobile DnD.
- Do not decide teams list vs cards or implement team-row/team-list DnD.
- Do not change dependencies or dnd-kit versions.
- Do not touch `docs/design/**` or temporary screenshots.
- Do not import V1 drag ghosts wholesale as the final V2 architecture.

## Repo Facts

Package manager: npm with `package-lock.json`.
Stack: Vite, React 19, TypeScript 6, Tailwind CSS v4, Vitest, ESLint, Zustand, Immer, dnd-kit core/sortable/utilities already installed.
Current Builder V2 DnD state: no `DndContext`, `useDraggable`, `useDroppable`, or `useSortable` in `src/features/builder-v2`; only `draggable={false}` on images.
Relevant V1 DnD references: `src/features/builder/BuilderPage.tsx`, `useBuilderDnd.ts`, `useBuilderDndWrappers.ts`, `createBuilderDndCoordinator.ts`, `dnd-ids.ts`, `types.ts`, `predicted-drop-hover.ts`, `BuilderDragOverlay.tsx`, `DragGhosts.tsx`, `CardWheelTile.tsx`, picker tile components, and builder DnD tests.
Validation commands: focused DnD and Builder V2 Vitest suites, `npx tsc -p tsconfig.app.json --noEmit`, targeted `npx eslint`, `npm run build:quiet`, and Browser/manual checks once visual DnD exists.
Relevant AGENTS.md instructions: prefer FFF MCP when available, do not close subagents before completion, prefer configured `scout`/`coder`/`web` presets, no remote state without explicit permission.

## Relevant Refactor Discipline Skills

| Signal / evidence | Required skill(s) | Applies now? | Task constraint |
|---|---|---|---|
| Fresh DnD architecture goal, broad scope, durable packet | `$refactor-goal-prep`, `$refactor-scout`, `$refactor-rootfix` | yes | This packet is the durable source of truth. |
| React component/hook wiring, dnd-kit sensors, layout integration | `$refactor-react` | yes | Keep event handlers and model commands separated; avoid wide model churn. |
| Typed payloads, drop IDs, descriptor contracts | `$refactor-typescript` | yes | Validate at DnD ingress; no broad `unknown`/casts in handlers. |
| Ghost/overlay CSS, clipping, focus/motion/visual states | `$refactor-tailwind`, `$refactor-ui-a11y` | yes | Require Browser/manual checks for visual slices. |
| V1 behavior parity and future regressions | `$refactor-characterization-tests` | yes | Characterize before behavior-heavy routing. |
| Avoiding V1 ghost/object sprawl | `$refactor-complexity`, `$refactor-architecture`, `$refactor-rootfix` | yes | Prefer one descriptor/overlay contract over parallel ghost-specific data. |
| dnd-kit already installed | `$refactor-dependencies` | not now | Required only for dependency/version changes. |
| Repeated future DnD mistakes | `$refactor-learning-maintainer`, `$refactor-lint-law` | maybe later | Maintenance only after implementation evidence. |

## First Tranche

Type:
- [x] read-only scout
- [ ] one bounded root-fix slice
- [ ] architecture seam cleanup
- [ ] React simplification
- [ ] Tailwind/custom CSS cleanup
- [ ] TypeScript/trust-boundary cleanup
- [ ] dependency economics review

Allowed files/areas for active W1 Worker: `src/features/builder-v2/builder-v2-dnd.ts`, `src/features/builder-v2/builder-v2-dnd.test.ts`, optional type exports in `src/features/builder-v2/BuilderV2ModelTypes.ts`, and this goal packet.
Protected files/areas: V1 builder behavior, mobile redesign, teams-list shape decisions, dependency files, remote state, `docs/design/**`, generated/domain data.
Expected simplification: a single typed V2 drag payload/preview/drop-target descriptor contract that deletes the need for separate picker object/card object/picker ghost/card ghost data models.
Validation: focused descriptor tests, `npx tsc -p tsconfig.app.json --noEmit`, targeted eslint, packet checker.
Rollback: revert the V2 DnD contract module/tests, optional type export, and packet updates.

## Goal Loop

### Scout

Read-only discovery. S1 collected V1 behavior parity, V2 insertion points, dnd-kit/test/a11y constraints, and imported architecture-hardening C8/C13.

### Judge

Choose exactly one candidate slice. Record allowed files, invariants, validation, rollback, and whether root-fix/characterization is selected. J1 selected D1+D2 as one pure TypeScript contract slice because descriptor payloads and encoded ids must agree before component wiring consumes them.

### Worker

Implement only the chosen slice. If same-concept files are missing from `allowed_files`, return `needs_scope_expansion`.

### Review

Run `$refactor-review` over diff, receipts, candidate register, and validation. Completion requires evidence. If any candidate remains queued or mapped, the broad DnD goal remains active with queued follow-ups.

### Maintenance

Run relevant maintenance skills only after implementation evidence shows the pattern is recurring and worth encoding.

## Root-Fix Decision

Symptom: V1 DnD behavior is useful, but its data/ghost/component shape accreted separate payloads, picker objects, card objects, picker ghosts, card ghosts, team preview ghosts, and special coordinators.

Likely root cause: V1 grew DnD around existing UI components rather than around a single drag intent and preview descriptor contract.

Local patch:
- Agent effort: low.
- Human effort: low now, high later.
- Behavior risk: medium as copied V1 handlers bring old ghost coupling into V2.
- Future complexity: high.
- Recurrence risk: high.

Root fix:
- Agent effort: medium and sliceable.
- Human effort: medium.
- Behavior risk: controlled by V1 parity characterization and focused descriptor tests.
- Future complexity: lower.
- Recurrence risk: lower.
- Concepts deleted: ghost-specific data models, render-label payloads, component-class dependent drag logic, speculative CSS roots.
- Concepts added: typed drag payload, drop target descriptor, preview descriptor, later coordinator.
- Rewrite simpler than patching: yes for V2 because no DnD code exists yet.
- Can be sliced: yes, contract -> characterization -> sources/targets -> routing -> overlay.
- Can be tested: yes with pure descriptor/router tests and existing V2 model/page tests.
- Rollback: revert each V2-only slice.
- Concept blast radius: V2 model/types/picker/team slots/page/CSS/tests; V1 read-only references.
- Scope expansion needed: no for D1; later behavior wiring may need command expansion.

Recommendation: root-fix goal with D1 descriptor contract first.

## Dependency Policy

`@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` are already installed. This goal does not authorize dependency changes. If a future slice proposes dependency/version changes, run `$refactor-dependencies` and ask for explicit approval.

## Harness / Learning Policy

If the single descriptor approach prevents repeated ghost/object sprawl, consider a repo-local learning note after D7. Do not add AGENTS.md, lint, or docs maintenance unless a maintenance task is explicitly selected.
