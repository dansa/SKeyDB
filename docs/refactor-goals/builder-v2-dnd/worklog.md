# Refactor Goal Worklog: builder-v2-dnd

## Entries

### 2026-05-23 - Goal packet created

- Source: User approved starting Builder V2 DnD as a new `$refactor-goal-prep` workflow and asked whether the harness/subagent stack could be handled without another reminder.
- Intake: Equivalent decisions supplied by user and prior Builder V2 architecture-hardening packet. Scope is Builder V2 DnD, desktop/adaptive first, with V1 as behavior reference but not implementation shape. Preserve current `/builder-v2` click assignment behavior and all `/builder` behavior.
- Native goal: created a Codex goal for this packet setup and S1 scout intake only.
- Subagents:
  - V1 DnD scout mapped `BuilderPage`, `useBuilderDnd`, `useBuilderDndWrappers`, `createBuilderDndCoordinator`, `DragData`, `dnd-ids`, predicted hover, behavior parity, quick-lineup, transfer dialogs, and tests.
  - V2 insertion scout mapped `BuilderV2ModelTypes`, `useBuilderV2Model`, `builder-v2-picker-options`, `BuilderV2AwakenerPicker`, `BuilderV2TeamSlots`, `BuilderV2Page`, `BuilderV2AdaptiveLayout`, and CSS clipping risks.
  - dnd-kit/a11y scout confirmed V2 has no dnd-kit implementation, V1 uses PointerSensor only, existing dnd-kit dependencies are sufficient, and manual desktop/adaptive checks should be required for visual DnD slices.
  - Completed scouts were closed after their results were recorded.
- Architecture handoff:
  - `docs/refactor-goals/builder-v2-architecture-hardening` J13 transferred C8/C13 into this packet.
  - C8 becomes D1/D5-style descriptor work; C13 becomes D8 overlay clipping work.
- Candidate register:
  - D1-D10 queued for DnD implementation and validation.
  - D11 team row/team-list DnD and D12 mobile DnD marked out of scope by user.
- Active task: `J1` choose the first Builder V2 DnD Worker slice. Current recommendation is D1, possibly with D2 if Judge decides V2 dnd-id helpers are part of the same pure contract.
- Validation: No product code changed during S1.
- Next prompt: `$refactor-goal-prep Continue docs/refactor-goals/builder-v2-dnd/goal.md.`

### 2026-05-23 - J1 selected first worker tranche

- Source: User asked to keep the loop running for a larger 30-40 minute burn, with Refactor Discipline harness, subagent scouting, and agent-backed coding.
- Native goal: created a Codex goal for continuing a larger Builder V2 DnD tranche.
- Subagents:
  - D1/D2 scout assigned to map the exact V2 payload, preview, drop-target, and id-helper contract.
  - D3 scout assigned to map first characterization tests for DnD behavior parity.
  - D4/D5 scout assigned to map future picker/source and active-slot target seams.
- Judge decision:
  - `D1` and `D2` are one pure contract slice because encoded ids and descriptor payloads must agree before component wiring can safely consume them.
  - Selected `W1` as the active Worker task.
- W1 scope:
  - Allowed: `src/features/builder-v2/builder-v2-dnd.ts`, `src/features/builder-v2/builder-v2-dnd.test.ts`, optional type exports in `BuilderV2ModelTypes.ts`, and this packet.
  - Protected: dnd-kit component wiring, overlay DOM/CSS, mobile redesign, teams-list shape decisions, dependencies, V1 behavior changes, remote state, and `docs/design/**`.
- Validation plan: focused `builder-v2-dnd.test.ts`, then `npx tsc -p tsconfig.app.json --noEmit`, targeted eslint, and packet checker.

### 2026-05-23 - W1 implemented D1/D2 DnD contract

- Worker: coder agent implemented the first bounded pure TypeScript slice.
- Files changed:
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
- Parent review adjustment:
  - Tightened team-origin payloads to carry `slotId` and `wheelIndex` source coordinates.
  - Changed the broad card/awakener drop target descriptor to `kind: "slot"` so routing can decide the action by dragged kind rather than by target label.
  - Changed picker/remove target ids to `builder-v2:picker` instead of kind-specific picker ids.
  - Expanded preview descriptors to include `kind`, `id`, `title`, `subtitle`, `imageSrc`, `imageAlt`, and typed badge tones.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run` passed, 7 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
- Candidate status:
  - D1 implemented.
  - D2 implemented.
- Next active task: `W2` characterize pure Builder V2 DnD routing decisions before React/dnd-kit wiring.

### 2026-05-23 - W2 implemented pure DnD routing characterization

- Worker: coder agent implemented pure routing helper and tests.
- Files changed:
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
- Parent review adjustment:
  - Replaced non-null assertions in tests with fixture helpers that throw clear errors when an occupied fixture is unexpectedly empty.
- Behavior decisions characterized:
  - Picker awakeners dropped on slot/wheel/covenant targets assign to the owning slot.
  - Picker wheels dropped on explicit wheel targets preserve `wheelIndex`.
  - Picker wheels dropped on slot/covenant targets produce slot-level wheel assignment with no index, leaving first-empty selection to the model/coordinator.
  - Picker covenants dropped on covenant/slot/wheel targets assign to the owning slot.
  - Picker posses only assign to the posse target.
  - Team wheels/covenants dropped on picker create remove intents.
  - Team wheel/covenant same-source same-target drops are no-ops.
  - Team-awakener-to-picker is explicitly a no-op until a remove-awakener DnD contract is selected.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts --run` passed, 18 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - `npx eslint src/features/builder-v2/builder-v2-dnd.ts src/features/builder-v2/builder-v2-dnd.test.ts` passed.
- Candidate status:
  - D3 implemented for pure routing characterization.
- Next active task: `W3` wire first functional picker-to-active-team DnD path through existing V2 model handlers.

### 2026-05-23 - W3 scope expanded for explicit target model bridge

- Worker result: coder agent stopped with `needs_scope_expansion` before editing, correctly identifying that the current V2 model assignment APIs are selection-based and a drag-end handler cannot safely call `select*` and `assign*` in sequence.
- Decision: accepted scope expansion as the same concept. Picker-origin DnD assignment resolves explicit slot/wheel/covenant/posse targets and therefore needs explicit target-aware model command entrypoints.
- Added allowed files for W3:
  - `src/features/builder-v2/BuilderV2ModelTypes.ts`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/builder-v2-loadout-commands.ts`
- Invariant: The bridge must be a thin explicit-target wrapper over existing command resolution/application, not a React state timing hack.

### 2026-05-23 - W3 implemented first functional picker-to-team DnD

- Worker: coder agent implemented the first functional dnd-kit wiring after the explicit-target bridge was added.
- Files changed:
  - `src/features/builder-v2/BuilderV2ActiveTeamChrome.tsx`
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/BuilderV2ModelTypes.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/builder-v2-loadout-commands.ts`
  - `src/features/builder-v2/useBuilderV2Dnd.ts`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
- Behavior:
  - Desktop and adaptive Builder V2 now wrap content in `DndContext` with PointerSensor distance 4.
  - Picker awakeners/wheels/covenants/posses are draggable while retaining click assignment.
  - Slot cards, wheel sockets, covenant buttons, and the active posse header target are droppable.
  - Picker-origin drag-end actions route through parsed V2 ids, validated payloads, pure action resolution, and explicit target model methods.
  - Team-origin move/remove actions remain intentionally ignored by dispatch until D6/D9 select command expansion.
  - Mobile remains untouched.
- Parent review adjustment:
  - Moved posse droppable ownership into `BuilderV2ActiveHeader` to avoid duplicated wrapper components in both desktop and adaptive layouts.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 93 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched Builder V2 DnD/model/component files passed.
  - Browser smoke: started Vite on `http://127.0.0.1:5173`, loaded `#/builder-v2` at 1365x900 desktop and 900x900 adaptive widths, confirmed Builder V2 desktop/adaptive regions rendered, then stopped the dev server.
- Candidate status:
  - D4 implemented.
  - D5 implemented for droppable targets; team-origin drag sources/actions remain queued through D6/D9.
  - D6 partially implemented for picker-origin dispatch and explicit target assignment bridge; queued for team-origin moves/removals.

### 2026-05-23 - J2 selected long-running D6 then D7/D8 tranche

- Source: User asked for another long runner, to pick a few tranches, keep the same harness routine, and anchor ghost visuals in V1 only as a reference while aligning with the newer Builder V2 visual guidelines.
- Native goal: created a Codex goal for team-origin DnD execution plus initial single-overlay/ghost architecture.
- Subagents:
  - D6 scout mapped team-origin move/remove execution and recommended model command expansion over DnD-hook mutation.
  - D7/D8 scout mapped a single descriptor-driven overlay architecture and CSS clipping/z-index risks.
  - D10 scout recommended documenting click-first fallback now and deferring KeyboardSensor until a separate keyboard drag design exists.
  - Completed scout agents were closed after their reports were recorded.
- Judge decision:
  - `W4` selects D6 team-origin execution first because team-origin overlays need real source payloads and behavior.
  - `W5` selects D7/D8 single overlay after W4 because the overlay should consume the now-complete source payload descriptor path.
  - `D10` is selected as a policy receipt, not implementation: pointer DnD is progressive enhancement; existing button clicks remain the required non-pointer fallback.
- W4 scope:
  - Allowed: `builder-v2-dnd.ts`, `builder-v2-dnd.test.ts`, `builder-v2-loadout-commands.ts`, `useBuilderV2Dnd.ts`, `useBuilderV2Model.ts`, `BuilderV2ModelTypes.ts`, `BuilderV2TeamSlots.tsx`, `useBuilderV2Model.test.ts`, and packet files.
  - Protected: overlay visuals, mobile redesign, teams-list shape decisions, dependencies, remote state, V1 behavior changes, and `docs/design/**`.
- W5 scope:
  - Allowed: new `BuilderV2DragOverlay.tsx`, `useBuilderV2Dnd.ts`, `BuilderV2Page.tsx`, `builder-v2.css`, focused tests, and packet files.
  - Protected: additional behavior changes, mobile redesign, teams-list shape decisions, dependencies, V1 ghost imports/copies, remote state, and `docs/design/**`.

### 2026-05-23 - W4 implemented team-origin DnD execution

- Files changed:
  - `src/features/builder-v2/BuilderV2ModelTypes.ts`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
  - `src/features/builder-v2/builder-v2-loadout-commands.ts`
  - `src/features/builder-v2/useBuilderV2Dnd.ts`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
- Behavior:
  - Occupied active-team awakeners, wheels, and covenants are now drag sources.
  - Team awakener dropped on picker now resolves to `remove-awakener`, using the existing model slot clear behavior that clears dependent wheels/covenant.
  - Team wheel/covenant remove-to-picker routes to model clear commands.
  - Team wheel/covenant moves route through explicit model methods and pure command resolvers over existing `swapWheelAssignments` / `swapCovenantAssignments` helpers.
  - DnD hook dispatch remains a thin action router; mutation stays centralized in model/command boundaries.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts --run` passed, 59 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed after moving dnd-kit attribute spreads before explicit `aria-pressed` props.
  - Targeted `npx eslint` over touched D6 files passed.

### 2026-05-23 - W5 implemented descriptor-driven overlay

- Worker: web agent implemented the first Builder V2 drag overlay.
- Files changed:
  - `src/features/builder-v2/BuilderV2DragOverlay.tsx`
  - `src/features/builder-v2/useBuilderV2Dnd.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - `useBuilderV2Dnd` now tracks an active preview descriptor on drag start and clears it on drag cancel/end.
  - Desktop and adaptive `DndContext` render one `BuilderV2DragOverlay`.
  - Overlay rendering consumes only `BuilderV2DragPreviewDescriptor`; it does not copy V1 ghost branches or import V1 ghost components.
  - CSS uses one compact preview card with `data-kind`, square art for awakeners/covenants/posses, wheel `75 / 113` art, and overlay z-index above the adaptive picker backdrop.
- Parent review adjustment:
  - Fixed disabled team-source draggable props so empty slot/wheel/covenant buttons do not receive dnd-kit `aria-disabled` / drag role attributes.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 94 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched DnD/model/component files passed.
  - `git diff --check` passed with an existing CRLF warning on `BuilderV2ActiveTeamChrome.tsx`.
  - Browser/Playwright smoke loaded `#/builder-v2` desktop and verified empty slot buttons no longer receive disabled draggable attributes. Playwright drag automation did not successfully exercise dnd-kit pointer assignment, so full visual drag confirmation remains a manual Browser/user check.

### 2026-05-23 - W6 fixed reported DnD parity gaps

- Source: User reported that V2 ghosts looked worse than V1, whole-slot swaps did not work, dragging to picker did not remove items, and cursor/drop targeting could choose the wrong card.
- New candidate receipts:
  - `D13` whole-slot/awakener-content swap.
  - `D14` picker remove drop zone.
  - `D15` pointer-first target correctness.
  - `D16` V1-aligned compact ghost polish.
- Files changed:
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/BuilderV2ModelTypes.ts`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
  - `src/features/builder-v2/builder-v2-loadout-commands.ts`
  - `src/features/builder-v2/builder-v2.css`
  - `src/features/builder-v2/useBuilderV2Dnd.ts`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
- Behavior:
  - Team awakeners now resolve `move-awakener` when dropped onto another slot-owned target, preserving the whole slot loadout through `swapSlotAssignments`.
  - The picker results surface is now a droppable remove target via `makeBuilderV2PickerDndId()`.
  - DnD collision detection now uses `pointerWithin` with `closestCenter` fallback so the cursor position controls the selected target more reliably.
  - Direct slot/wheel/covenant/picker drop states now get visible hover/remove target classes.
  - The drag ghost was tightened toward the V1 compact horizontal art/text shape.
- Browser validation:
  - Browser plugin loaded `http://127.0.0.1:5173/#/builder-v2`.
  - Dragged Slot 1 onto Slot 2; slot names swapped from `Arachne, 24` to `24, Arachne`.
  - Dragged the occupied Slot 2 to the picker results; it became `Empty Slot`.
  - Dragged the first picker tile onto Slot 3; Slot 3 became `Doll: Inferno`.
- Automated validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 96 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched Builder V2 DnD/model/component files passed.

### 2026-05-23 - W6 expanded card-level equipment parity and closed in-scope goal

- Follow-up parity found while checking V1:
  - Team wheels dropped on a card-level target should move to the first empty wheel socket on that slot.
  - Team covenants dropped on card-level or wheel-owned targets should move to that owning slot.
- Files changed:
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
  - `src/features/builder-v2/builder-v2-loadout-commands.ts`
  - `src/features/builder-v2/useBuilderV2Dnd.ts`
  - `src/features/builder-v2/useBuilderV2Model.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
  - `src/features/builder-v2/BuilderV2ModelTypes.ts`
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 98 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched Builder V2 DnD/model/component files passed.
- Goal status:
  - All in-scope DnD candidates are implemented.
  - D11 team-row/team-list DnD and D12 mobile DnD remain out of scope by user.

### 2026-05-23 - W7 refined drag ghost visual language

- Source: User confirmed mechanics felt good but clarified the remaining issue was ghost styling: picker/content ghosts should be art-only with thin picker chrome, and whole-slot drags should look representative of the slot being dragged.
- Files changed:
  - `src/features/builder-v2/BuilderV2DragOverlay.tsx`
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
  - `src/features/builder-v2/builder-v2.css`
- Behavior and visual changes:
  - Added a small `variant` field to `BuilderV2DragPreviewDescriptor`.
  - Picker and equipment drags use `variant: "item"` and now render as art-only previews with thin picker-border chrome and no visible text.
  - Whole-slot/team-awakener drags use `variant: "slot"` and render as a compact full-art slot-card ghost with bottom name/slot meta.
  - Team-awakener payloads now use full card art when available instead of portrait art for their slot ghost.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 54 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over overlay and DnD contract/test files passed.
  - Browser plugin reloaded `/builder-v2` and confirmed the updated ghost CSS rules were present in the running app.

### 2026-05-23 - W8 added predicted effective drop hover

- Source: User approved porting V1-style predicted hover behavior and settled the product rule that broad wheel drops fill only empty sockets, while covenant drops may resolve through the card because there is only one covenant destination.
- Files changed:
  - `src/features/builder-v2/BuilderV2ActiveTeamChrome.tsx`
  - `src/features/builder-v2/BuilderV2AdaptiveLayout.tsx`
  - `src/features/builder-v2/BuilderV2AwakenerPicker.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/BuilderV2TeamSlots.tsx`
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - Added `resolveBuilderV2EffectiveDropTarget` so hover prediction and final drop routing share one effective-target rule.
  - Wheel drags over a card/covenant surface resolve to the first empty wheel socket and highlight that socket.
  - Wheel drags over a card with both sockets filled now resolve to no target unless dropped directly on a specific W1/W2 socket.
  - Covenant drags over card or wheel child surfaces resolve to the owning covenant slot and highlight covenant chrome.
  - Picker remove and posse hover now use the same active predicted target path instead of raw literal `isOver` during active drags.
- Product note:
  - Existing shared awakener assignment currently resets wheels and covenant when replacing an awakener from the picker. This pass did not change that broader assignment semantic.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 58 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched Builder V2 DnD/component files passed.
  - `git diff --check` passed with an existing CRLF warning on `BuilderV2ActiveTeamChrome.tsx`.
  - Packet checker passed.

### 2026-05-23 - Follow-up: preserve loadout on awakener replacement

- Source: User approved flipping the picker/click replacement rule after clarifying that wheels and covenants are universally valid, with exclusivity handled separately.
- Files changed:
  - `src/features/builder/team-state.ts`
  - `src/features/builder/team-state.test.ts`
  - `src/features/builder-v2/useBuilderV2Model.test.ts`
- Behavior:
  - `assignAwakenerToSlot` now preserves the target slot's wheels and covenant when replacing its awakener.
  - Existing clear/remove slot behavior remains the destructive reset path for removing the unit and loadout.
  - Moving a duplicate/alternate-form source out of another slot still clears that source slot's wheels and covenant.
- Validation:
  - `npx vitest run src/features/builder/team-state.test.ts src/features/builder-v2/useBuilderV2Model.test.ts src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 124 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched state/test files passed.

### 2026-05-23 - Follow-up: reject equipment drops on empty slot chrome

- Source: User noticed empty slots still expose hover chrome for wheel/covenant targets, making invalid equipment drops look accepted.
- Files changed:
  - `src/features/builder-v2/builder-v2-dnd.ts`
  - `src/features/builder-v2/builder-v2-dnd.test.ts`
- Behavior:
  - Effective wheel targets now require an awakened target slot when slot state is available, including explicit W1/W2 child targets.
  - Effective covenant targets already resolved through the owning slot; tests now pin that empty slot child targets resolve to no target.
  - Final drop routing uses the same effective-target resolver, so invalid hover and invalid drop behavior remain aligned.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 59 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched DnD files passed.

### 2026-05-23 - Follow-up: removal chrome on drag ghost

- Source: User noted V1 also chromed the ghost itself when dragged over the picker remove zone.
- Files changed:
  - `src/features/builder-v2/BuilderV2DragOverlay.tsx`
  - `src/features/builder-v2/BuilderV2Page.tsx`
  - `src/features/builder-v2/builder-v2.css`
- Behavior:
  - The single V2 drag overlay now receives remove intent from `activeDropTarget?.kind === "picker"`.
  - Item ghosts show a compact removal tag and removal-tone border/shadow when hovering the picker.
  - Slot ghosts use the same removal tone without rendering a visible action chip.
- Validation:
  - `npx vitest run src/features/builder-v2/builder-v2-dnd.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passed, 59 tests.
  - `npx tsc -p tsconfig.app.json --noEmit` passed.
  - Targeted `npx eslint` over touched overlay/page files passed.
