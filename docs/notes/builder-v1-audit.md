# Builder v1 — Full Codebase Audit

**Date:** 2026-03-11
**Purpose:** Comprehensive inventory of every file, behavior, interaction, and state flow in the current Builder page, to inform the Builder v2 clean-slate rebuild.

---

## 1. File Inventory (51 files)

### 1A. Page Shell & Orchestration (1 file, ~740 lines)

| File | Lines | Role |
|------|-------|------|
| `BuilderPage.tsx` | 740 | Top-level orchestration. Owns the `DndContext`, wires every hook and action builder, renders the layout grid, toolbar, dialogs, drag overlay, and toast. |

**Assessment:** This is the primary pain point. It destructures ~95 values from `useBuilderViewModel`, then passes them through ~15 action builders and hooks, resulting in massive prop drilling. The layout is hardcoded as `grid-cols-[2fr_1fr]` with height-syncing via `ResizeObserver` + `useLayoutEffect`. Adding responsive modes here would be fighting the architecture.

### 1B. View Model & Preferences (2 files, ~1087 lines)

| File | Lines | Role |
|------|-------|------|
| `useBuilderViewModel.ts` | 860 | God hook. Owns teams, activeTeamId, collection ownership, filtering, sorting, quick lineup, selection state, persistence, rename state. Returns ~90 values. |
| `useBuilderPreferences.ts` | 227 | Picker/filter/sort/display preferences with localStorage persistence and global search capture. |

**Assessment:** `useBuilderViewModel` is the second major pain point. It bundles:
- **Team CRUD state** (teams, activeTeamId, slots, posse)
- **Collection ownership** (awakener/wheel/posse levels)
- **Filtered lists** (awakeners, wheels, posses, covenants with search/filter/sort)
- **Selection state** (activeSelection, resolvedActiveSelection)
- **Quick lineup session** (internal state machine)
- **Team rename state** (editingTeamId, editingTeamName, editingTeamSurface)
- **Persistence** (autosave debounce)
- **Build recommendations** (delegated to useAwakenerBuildRecommendations)

These are at least 5-6 distinct ownership concerns mashed into one hook.

### 1C. Action Builders (5 files, ~504 lines)

| File | Lines | Role |
|------|-------|------|
| `createBuilderAwakenerActions.ts` | 127 | Picker awakener drop/click → assign to slot, handle cross-team transfers |
| `createBuilderWheelActions.ts` | 206 | Picker wheel drop/click → assign, swap within team, cross-team transfer |
| `createBuilderCovenantActions.ts` | 90 | Picker covenant drop/click → assign, swap |
| `createBuilderPosseActions.ts` | 75 | Posse assignment with cross-team transfer |
| `createBuilderDndCoordinator.ts` | 154 | Routes DnD events by drag kind (team-row, team-preview-slot, or normal builder drag) |

**Assessment:** These are well-structured plain functions (not hooks). Each takes dependencies and returns action handlers. They can be reused as-is in v2, though their interfaces will need adjusting if the selection/state model changes.

### 1D. DnD Layer (7 files, ~573 lines)

| File | Lines | Role |
|------|-------|------|
| `useBuilderDnd.ts` | 263 | Core DnD state (activeDrag, isRemoveIntent, sensors). Routes `DragEnd` by drag kind to the correct action. |
| `useBuilderDndWrappers.ts` | 77 | Wraps coordinated DnD handlers to add predicted drop hover and team-edit suppression timing. |
| `usePreviewSlotDrag.ts` | 37 | Preview strip slot drag state (team panel mini-cards). |
| `dnd-ids.ts` | 74 | Drop zone ID format: `dropzone:wheel:slot-1:0`, `dropzone:covenant:slot-1`, etc. Parsers. |
| `predicted-drop-hover.ts` | 80 | Resolves which wheel/covenant slot will receive a drop during drag-over. |
| `DragGhosts.tsx` | 281 | Ghost overlays for every draggable type (picker awakener, wheel, covenant, posse; team card, wheel, covenant; team preview). |
| `PickerDropZone.tsx` | 20 | Thin wrapper around `useDroppable`. |

**Assessment:** The DnD layer is actually fairly clean. The ID scheme, parsers, and ghost rendering are well-scoped. The main issue is that `useBuilderDnd` has to know about every drag kind, making it a large switch. For v2, the DnD coordination can be simplified if we reduce the number of simultaneous droppable surfaces (mobile won't show team cards + picker at the same time).

### 1E. Team State & Rules (7 files, ~996 lines)

| File | Lines | Role |
|------|-------|------|
| `team-state.ts` | 390 | Pure functions: assignAwakener, swapSlots, assignWheel, swapWheels, assignCovenant, swapCovenants, clearSlot/wheel/covenant. Realm violation checks. |
| `team-collection.ts` | 221 | Team CRUD: create, add, delete, rename, reorder, reset, applyTemplate. MAX_TEAMS=10. |
| `transfer-resolution.ts` | 306 | Cross-team transfer logic: move awakener/wheel/posse between teams, support slot handling, preview slot swaps. |
| `team-validation.ts` | 39 | Validates teams against duplicate rules via domain team-rules. |
| `team-plan.ts` | 25 | Converts Team[] to the shape expected by domain team-rules validator. |
| `selection-state.ts` | 109 | Pure functions: toggle selection, compute next selection after swap/remove. |
| `quick-lineup.ts` | 200 | Quick lineup state machine: create session, build steps, navigate forward/back, reconcile after slot changes. |

**Assessment:** This is the strongest layer. All pure functions, well-tested, no UI coupling. **Reuse entirely in v2.**

### 1F. Picker Components (10 files, ~930 lines)

| File | Lines | Role |
|------|-------|------|
| `BuilderSelectionPanel.tsx` | 229 | Picker shell: TabbedContainer with controls, filters, content. Height-synced to main zone. |
| `BuilderSelectionControls.tsx` | 190 | Sorting expander + toggle pills (Display Unowned, Allow Dupes, etc.) |
| `BuilderSelectionFilters.tsx` | 185 | Search input + realm/rarity/mainstat filter chips per tab. |
| `BuilderSelectionContent.tsx` | 126 | Routes to correct picker grid by tab. Contains PickerDropZone. |
| `AwakenerPickerGrid.tsx` | 44 | Maps filteredAwakeners → PickerAwakenerTile. |
| `WheelPickerGrid.tsx` | 109 | Maps filteredWheels → PickerWheelTile. |
| `CovenantPickerGrid.tsx` | 54 | Maps filteredCovenants → PickerCovenantTile. |
| `PossePickerGrid.tsx` | 204 | Maps filteredPosses, includes recommendation labels. |
| `PickerAwakenerTile.tsx` | 117 | Uses CompactArtTile with portrait asset, realm tint, status labels. |
| `PickerWheelTile.tsx` | 160 | Uses CompactArtTile with wheel asset, rarity/mainstat labels, recommendation chips. |
| `PickerCovenantTile.tsx` | 109 | Uses CompactArtTile with covenant asset, recommendation chips. |

**Assessment:** The picker grid components are well-scoped and can be reused directly. `BuilderSelectionPanel` has layout coupling (height sync) that won't carry over to v2. Controls and filters are reusable.

### 1G. Card Components (4 files, ~617 lines)

| File | Lines | Role |
|------|-------|------|
| `AwakenerCard.tsx` | 283 | Full card rendering: art, overlays, name, wheel zone. DnD draggable/droppable. Active selection ring. |
| `CardWheelZone.tsx` | 100 | Bottom zone: level display, dupe diamonds, 2 wheel tiles + covenant tile. |
| `CardWheelTile.tsx` | 178 | Individual wheel slot: art, dupe indicator, active/hover states, DnD. |
| `CardCovenantTile.tsx` | 156 | Covenant slot: circular art, active/hover states, DnD. |

**Assessment:** Reusable in v2 with minor layout adjustments. The card itself doesn't encode the page layout — it just renders its own anatomy.

### 1H. Active Team Panel (2 files, ~450 lines)

| File | Lines | Role |
|------|-------|------|
| `BuilderActiveTeamPanel.tsx` | 274 | The 4-card grid + quick lineup controls bar. Hard-coded `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`. |
| `ActiveTeamHeader.tsx` | 176 | Realm badge, team name editor, posse button. |

**Assessment:** `BuilderActiveTeamPanel` is the layout component that needs the most change for responsive. The grid breakpoints are the source of the mobile problem. `ActiveTeamHeader` is reusable.

### 1I. Teams Panel (4 files, ~593 lines)

| File | Lines | Role |
|------|-------|------|
| `BuilderTeamsPanel.tsx` | 153 | Teams list with compact/expanded toggle, templates, add team button. SortableContext for reorder. |
| `BuilderTeamRow.tsx` | 179 | Single team row: drag handle, name editor, preview strip, posse icon, action buttons. |
| `BuilderTeamPreviewStrip.tsx` | 42 | Renders 4 slot previews for a team row. |
| `BuilderTeamSlotPreview.tsx` | 219 | Compact (portrait) or expanded (card + wheels + covenant) preview per slot. DnD for cross-team swap. |

**Assessment:** Reusable as-is for desktop. For mobile, the teams panel would likely be a different view entirely.

### 1J. Dialogs & Toolbar (5 files, ~354 lines)

| File | Lines | Role |
|------|-------|------|
| `BuilderToolbar.tsx` | 82 | Import/Export/Reset buttons. |
| `BuilderConfirmDialogs.tsx` | 70 | Delete/Transfer/Reset confirmation dialogs. |
| `BuilderTransferConfirmDialog.tsx` | 37 | Transfer-specific dialog with "Use as Support" option. |
| `BuilderImportExportDialogs.tsx` | 165 | Import/Export/Replace/Strategy/Duplicate-override dialogs. |
| `TeamNameInlineEditor.tsx` | 91 | Inline team name editing with commit/cancel. |

**Assessment:** All reusable without changes.

### 1K. Import/Export (3 files, ~566 lines)

| File | Lines | Role |
|------|-------|------|
| `useBuilderImportExport.ts` | 124 | Export dialog state + hooks into import flow. |
| `useBuilderImportFlow.ts` | 440 | Multi-step import state machine (decode → validate → strategy → duplicate override → finalize). |
| `import-planner.ts` | 402 | Pure functions: conflict detection, move/skip strategies, team merging. |

**Assessment:** The import flow is complex but self-contained. Reuse entirely.

### 1L. Persistence (1 file, 246 lines)

| File | Lines | Role |
|------|-------|------|
| `builder-persistence.ts` | 246 | Strict validation + normalization for localStorage save/load. Versioned envelope. |

**Assessment:** Reuse entirely.

### 1M. Confirm/Transfer Hooks (4 files, ~350 lines)

| File | Lines | Role |
|------|-------|------|
| `useTransferConfirm.ts` | 125 | Pending transfer state (awakener/wheel/posse cross-team). |
| `usePendingDeleteDialog.ts` | 73 | Delete team confirmation. |
| `usePendingResetTeamDialog.ts` | 68 | Reset team confirmation. |
| `usePendingTransferDialog.ts` | 84 | Transfer dialog rendering data. |

**Assessment:** Reuse as-is.

### 1N. Other Hooks & Utilities (5 files, ~170 lines)

| File | Lines | Role |
|------|-------|------|
| `useBuilderResetUndo.ts` | 98 | Snapshot-based undo for full builder reset (15s timeout). |
| `useSelectionDismiss.ts` | 44 | Global pointerdown listener to dismiss selection. |
| `useGlobalPickerSearchCapture.ts` | 43 | Types anywhere → appends to picker search. |
| `useAwakenerBuildRecommendations.ts` | 80 | Loads build data, resolves active build + recommended posses. |
| `utils.ts` | 39 | `isTypingTarget`, `getDragKind`, `toOrdinal`. |

**Assessment:** All reusable.

### 1O. Constants, Types, Re-exports (4 files, ~118 lines)

| File | Lines | Role |
|------|-------|------|
| `types.ts` | 83 | All TypeScript types (TeamSlot, Team, DragData, ActiveSelection, QuickLineupSession, filters). |
| `constants.ts` | 23 | `allAwakeners`, `awakenerByName`, `createEmptyTeamSlots`. |
| `picker-status-labels.ts` | 6 | CSS class constants for picker tile status bars. |
| `wheel-mainstats.ts` | 6 | Re-exports from domain. |

### 1P. Test Files (7 files)

| File | Role |
|------|------|
| `createBuilderAwakenerActions.test.ts` | Action tests |
| `createBuilderCovenantActions.test.ts` | Action tests |
| `createBuilderWheelActions.test.ts` | Action tests |
| `createBuilderDndCoordinator.test.ts` | DnD coordinator tests |
| `builder-persistence.test.ts` | Persistence round-trip tests |
| `import-planner.test.ts` | Import planner tests |
| `predicted-drop-hover.test.ts` | Predicted drop hover tests |
| `BuilderTeamsPanel.test.tsx` | Teams panel tests |
| `DragGhosts.test.tsx` | Ghost rendering tests |

---

## 2. Complete Behavior Inventory

### 2A. Team Management
- **Create team** — auto-named "Team N", up to MAX_TEAMS (10)
- **Delete team** — confirmation if has awakeners, fallback to first remaining team
- **Rename team** — inline editor, header or list surface, commit on Enter/blur, cancel on Escape
- **Reorder teams** — drag handle in teams panel, `SortableContext` with vertical list strategy
- **Reset team** — clears all slots + posse, confirmation if non-empty
- **Reset builder** — clears everything, 15s undo window with snapshot
- **Apply template** — D-Tide 5 or D-Tide 10, renames existing + creates/removes teams

### 2B. Slot Assignment
- **Assign awakener to slot** — click (into selected slot or first empty) or drag to slot
- **Swap slots** — drag card onto another card
- **Clear slot** — drag card to picker zone, or remove button when selected
- **Realm validation** — max 2 realms per team, violation toast
- **Identity dedup** — same awakener can't appear twice unless Allow Dupes enabled
- **Cross-team transfer** — if awakener used in another team, confirmation dialog (Move / Use as Support)
- **Support awakener** — marked isSupport, level=90, bypasses identity dedup

### 2C. Wheel Assignment
- **Assign wheel** — click (into selected wheel slot) or drag to wheel zone
- **Auto-slot** — if dragged to card (not wheel zone), fills first empty wheel
- **Swap wheels** — drag wheel onto another wheel (same or different card)
- **Clear wheel** — drag to picker zone, or remove button
- **Cross-team transfer** — if wheel used in another team, confirmation dialog
- **Same-team reuse** — if wheel already on this team (different slot), auto-swaps

### 2D. Covenant Assignment
- **Assign covenant** — click or drag to covenant zone / card
- **Swap covenants** — drag covenant to another card's covenant zone
- **Clear covenant** — drag to picker zone, or remove button

### 2E. Posse Assignment
- **Set posse** — click in picker or drag, one per team
- **Clear posse** — select "Not Set" option
- **Cross-team transfer** — confirmation if used by another team

### 2F. Selection System
- **Active selection** — `{kind: 'awakener'|'wheel'|'covenant', slotId, wheelIndex?} | null`
- **Toggle behavior** — clicking same slot deselects, clicking different slot switches
- **Picker tab auto-switch** — selecting a wheel slot switches to wheels tab, etc.
- **Selection dismiss** — global pointerdown outside picker/card dismisses selection
- **Quick lineup override** — during quick lineup, clicks jump to that step instead

### 2G. Quick Lineup
- **Start** — clears active team, creates step sequence: [awakener×4, wheel×8, covenant×4, posse]
- **Step navigation** — auto-advance after assignment, skip, back (with history)
- **Step reconciliation** — if slots change, session recalculates current step
- **Empty slot skip** — if awakener step left empty, skips wheel/covenant for that slot
- **Finish/Cancel** — finish keeps current state, cancel restores original team snapshot

### 2H. Picker System
- **4 tabs** — Awakeners, Wheels, Posses, Covenants
- **Search** — per-tab search, global keyboard capture (typing anywhere focuses search)
- **Filters** — Realm (awakeners, posses), Rarity + Mainstat (wheels)
- **Sorting** — Awakener sort by level/rarity/enlighten/alphabetical, direction toggle, group by realm
- **Toggles** — Display Unowned, Sink Unowned to Bottom, Allow Dupes, Promote Recommended Gear, Promote Matching Wheel Mainstats
- **Recommendations** — BiS/Alt chips on wheel/covenant tiles based on active build data
- **Status labels** — "Already Used", "In Use", "Wrong Realm", "Unowned" on tiles

### 2I. DnD System
- **Drag types** — picker-awakener, picker-wheel, picker-covenant, picker-posse, team-slot, team-wheel, team-covenant, team-preview-slot, team-row
- **Drop zones** — slot cards, wheel zones, covenant zones, picker zone (for removal)
- **Predicted hover** — during drag, shows which exact sub-zone will receive the drop
- **Remove intent** — dragging team items over picker zone shows removal styling
- **Ghost overlays** — scaled-down ghost for each drag type
- **Team row reorder** — separate sortable context for team list

### 2J. Import/Export
- **Import** — decode → validate → resolve conflicts (replace all / strategy: move or skip duplicates / duplicate override)
- **Export all** — multi-team code
- **Export single team** — standard code
- **Export in-game** — game-specific format with WIP warnings
- **Smart import** — if active team is empty, imports into it instead of creating new

### 2K. Persistence
- **Autosave** — 300ms debounce to localStorage
- **Strict validation** — on load, validates every team/slot/wheel field
- **Normalization** — cleans up empty slots, resolves legacy `faction` → `realm`
- **Versioned** — envelope with version number and timestamp

---

## 3. v2 Design Directives

The v2 rebuild is not a salvage operation. We know exactly what every behavior does and how it should work. The goal is to build it right from scratch, informed by full knowledge of v1.

### 3A. Tailwind & CSS Discipline

**Current problem:** `index.css` is **2,265 lines** of hand-written CSS with:
- Hundreds of hardcoded `rgba()` values for the same conceptual colors (amber glow, slate borders, dark backgrounds, unowned tints, active selection highlights)
- Duplicated patterns: scrollbar styles appear twice (`builder-picker-scrollbar` / `collection-scrollbar`), unowned filter appears 3× (`wheel-tile-unowned` / `builder-card-art-unowned` / `builder-picker-art-unowned`), badge/chip styles are copied with minor tweaks
- BEM-style class proliferation for components that could use Tailwind utilities (`.ownership-pill__thumb`, `.ownership-pill__label`, `.ownership-pill__label-owned`, etc.)
- Inline Tailwind in `.tsx` files fighting with custom CSS classes on the same elements
- `App.css` is leftover Vite boilerplate (43 lines, unused)

**v2 approach:**
- **CSS variables for the design palette.** Define named tokens: `--color-glow-amber`, `--color-border-subtle`, `--color-bg-surface`, `--color-unowned-tint`, `--color-active-ring`, etc. Every `rgba(251, 191, 36, ...)` becomes a reference to one variable.
- **Let Tailwind do layout, spacing, typography, transitions.** Custom CSS only for things Tailwind genuinely can't express: complex pseudo-element compositions (sigil placeholders, realm badge glows), multi-stop gradients, `:has()` selectors.
- **Shared utility classes for repeated visual patterns:** `.art-unowned` (one definition, not three), `.themed-scrollbar`, `.chip-badge`, `.tile-interactive`.
- **No fight between Tailwind and custom CSS on the same element.** If a component needs custom CSS, it owns a class; Tailwind handles the rest.
- **Delete `App.css`** — it's unused Vite scaffold.

### 3B. Smarter Components & Hooks

**Current problem:** Many components are builder-specific but contain patterns useful across pages (picker grids, search/filter/sort, tile rendering, inline editors, confirmation dialogs). Hooks like `useBuilderViewModel` bundle 6+ unrelated concerns.

**v2 approach:**
- **Design components and hooks with cross-page reuse in mind**, even if we only use them in builder initially. Collection page, future team viewer, etc., should be able to consume the same primitives.
- **Shared hooks for recurring patterns:**
  - `useFilteredSortedList<T>` — search, filter chips, sort key + direction, toggle flags, tiebreak chains. Awakeners, wheels, posses, covenants all use this pattern; collection page uses it too.
  - `usePersistentPreferences` — typed localStorage preferences with defaults and migration.
  - `useConfirmDialog` — generic confirm/cancel state machine (delete, reset, transfer all use same shape).
  - `useInlineEditor` — draft name, commit/cancel, blur behavior (team names, collection labels).
- **Shared sort/tiebreak infrastructure:** Awakeners, wheels, and posses share tiebreak logic (level → rarity → alphabetical). This should be one composable comparator chain, not reimplemented per-entity.
- **Split the god hook.** `useBuilderViewModel` (860 lines, ~90 return values) becomes focused hooks with clear ownership boundaries: team CRUD, selection state, picker state, quick lineup, persistence. Each hook owns its state + effects.
- **Extraction quality bar:** New hooks must own state/effects/refs. New components must own state, effects, or meaningful derivation, or be a distinct visual zone with a narrow interface. Apply the delete test.

### 3C. DnD Kit Improvements

**Current problem:**
- Team row sortables don't feel smooth — transitions and animation config may not match dnd-kit best practices
- Large monolithic `handleDragEnd` switch that knows every drag type
- DnD assumes picker + cards are both visible simultaneously
- No drag animation customization beyond basic ghost overlays

**v2 approach:**
- **Smooth sortable animation.** Review dnd-kit docs examples for `animateLayoutChanges`, `transition` config, and proper `SortableContext` strategy. The team list reorder should feel polished.
- **Modular drag handlers.** Instead of one giant switch, each drag-aware zone registers its own drop handler. The coordinator becomes a thin router, not an encyclopedia.
- **Layout-mode-aware DnD.** Mobile/tablet modes may only show one panel at a time — DnD simplifies to within-panel operations. Desktop mode keeps cross-panel drag. The DnD system adapts to which surfaces are actually visible.
- **Consider `dnd-kit` collision detection tuning** for the various drop zone sizes (small wheel tiles vs. large card zones).

### 3D. Centralized Rules & Validation

**Current problem:** Team rules (realm limits, duplicate checks, identity validation) are checked inline in action handlers with scattered toast notifications. Sorting/ordering/search patterns are reimplemented per entity type.

**v2 approach:**
- **Centralized rule engine.** One validation pass that all mutation paths flow through. Action handlers call `validateAndApply(mutation)` instead of checking rules inline.
- **Shared sorting infrastructure.** One comparator-chain builder that serves awakeners, wheels, posses, and covenants. Tiebreak order, direction, and grouping are configuration, not code duplication.
- **Shared search/filter infrastructure.** Normalized search, filter chips, and toggle state are one composable system. Builder and collection share the same foundation.

### 3E. Viewport & Layout System

**Current problem:** The layout is hardcoded `grid-cols-[2fr_1fr]` with a `ResizeObserver` + `useLayoutEffect` hack to height-sync the picker panel to the main zone. Card grid uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` which breaks at mobile widths. No concept of layout modes.

**v2 approach:**
- **Keep the centered max-width layout on desktop.** The current width is fine — desktop doesn't need more horizontal space. The problem is vertical, not horizontal.
- **Picker can outgrow the builder vertically.** The picker doesn't need to height-match the card zone — it should use available vertical space (CSS `dvh` / `sticky` / `max-height: calc(100dvh - header)`). But it also needs a **usable minimum height** — on low-height viewports the picker can't shrink to unusable. Scrolling the picker is fine; a 3-row picker that can't display enough tiles is not.
- **Builder area stays layout-consistent** within a mode. No reflowing the card grid because the window resized by 20px. Each mode has a stable layout.
- **Explicit layout modes** with a state machine:
  - **Desktop:** Cards + picker side-by-side, teams panel below
  - **Tablet:** Cards stacked, picker as slide-out drawer
  - **Mobile:** Focused card view, picker as full drawer, overview as card strip
- **Layout mode override buttons.** Users can opt into tablet layout on desktop, or mobile layout on tablet, etc. The layout mode is a preference, not purely a media query. Auto-detect by default, manual override available.
- **Cross-device interaction design.** Mobile-first modes must also be usable on desktop (keyboard, cursor). Desktop modes must also consider touch — tap targets can't be tiny. Scrolling is always valid; swipe gestures are supplementary, not required. Elements need to be large enough to tap on a phone without cursor precision, but the UI can't be so touch-inflated that it wastes space on desktop.

### 3F. Cross-Page Design Awareness

**v2 approach:**
- Components and hooks are designed with collection page, team viewer, and future pages in mind.
- We don't touch other pages in this rebuild, but shared primitives (picker grids, filter/sort hooks, tile components, dialog hooks, inline editors) should be usable outside builder with no builder-specific coupling.
- Domain logic (team-state, validation, import/export) already lives in the right layer and stays there.

---

## 4. v1 Pain Points (Reference)

### 4A. The 95-value destructure
`BuilderPage.tsx` destructures ~95 values from `useBuilderViewModel` and passes them through action builders, then drills them into components. This is the #1 complexity driver.

### 4B. Layout is hardcoded landscape
The `grid-cols-[2fr_1fr]` layout with `ResizeObserver` height sync assumes cards and picker are always side-by-side. The card grid uses `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` which breaks at mobile widths.

### 4C. DnD assumes everything is visible
The current DnD routes assume picker and cards are both visible simultaneously. Mobile modes (focused card, drawer picker) will have only one visible at a time, simplifying DnD but requiring a different interaction model (click-to-assign becomes primary).

### 4D. No layout mode concept
There's no concept of "which view am I in?" The current UI always shows the same layout, just reflowed by CSS. The v2 responsive design requires an explicit layout state machine.

### 4E. CSS bloat
2,265 lines of custom CSS in `index.css` with pervasive color duplication, pattern duplication, and Tailwind/custom-CSS fights. No CSS variable system for the design palette.

### 4F. No shared infrastructure
Sorting, search, filtering, tiebreaks, inline editing, confirm dialogs are all reimplemented per context instead of composed from shared primitives.

---

## 5. Prior Knowledge: What We Know Works

The v1 audit gives us a **complete behavioral specification**. Every interaction, every edge case, every validation rule is documented in Section 2. The domain logic layer (team-state, team-collection, transfer-resolution, selection-state, quick-lineup, import-planner, persistence) is pure, well-tested, and has the correct behavior. This is the ground truth for v2 behavior.

The v2 rebuild uses this knowledge to build the right architecture from scratch — not to copy files, but to implement the same behaviors in a cleaner, more composable, and more maintainable way.

---

## 6. Line Count Summary

| Category | Files | Lines |
|----------|-------|-------|
| Page shell | 1 | 740 |
| View model & prefs | 2 | 1,087 |
| Action builders | 5 | 504 |
| DnD layer | 7 | 573 |
| Team state & rules | 7 | 996 |
| Picker components | 11 | 930 |
| Card components | 4 | 617 |
| Active team panel | 2 | 450 |
| Teams panel | 4 | 593 |
| Dialogs & toolbar | 5 | 354 |
| Import/export | 3 | 566 |
| Persistence | 1 | 246 |
| Confirm/transfer hooks | 4 | 350 |
| Other hooks & utils | 5 | 170 |
| Constants & types | 4 | 118 |
| Custom CSS (`index.css`) | 1 | 2,265 |
| **Total** | **66** | **~10,559** |
