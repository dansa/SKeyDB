# Builder QOL Stage 2 Plan

> Archived implementation plan. Keep for historical context only. If related work resumes, create a new plan in `docs/plans/`.

Last updated: 2026-02-28

## Goal
Ship the next builder-focused QOL/features batch in small, low-risk slices while the recent in-game codec and UI work is still stable.

This pass should favor:
- easiest wins first,
- behavior that composes with current team/builder rules,
- no large layout rewrite,
- no mobile/compact redesign in this batch.

## Scope Triage

### Deferred for a later dedicated pass
- Mobile / compact browser-friendly UI.
  - This is effectively a builder layout rewrite with interaction changes.
  - It deserves its own branch/plan and should not be mixed with smaller builder feature churn.
- URL encoding / share-via-link.
  - High-risk because it touches persistence/share semantics and accidental overwrite UX.
- Multiple on-site saved planners.
  - Worth doing, but it overlaps persistence/product decisions more than current builder QOL.

### Candidate items for this stage
- Weird covenant slot scaling behavior on some devices.
- Allow one duped character to mirror in-game support behavior.
- Toggle to disable duplication blockers for free-form/planner-only setups.
- Quick team planner mode.
- Expanded teams toggle (compact full-team cards that show wheels/covenants).
- Support drag-replacing units between teams.

## Recommended Execution Order

### Phase 1: Small, low-risk wins
1. Covenant slot scaling fix. [done]
2. Duplication blocker override toggle. [done]

Why first:
- both are isolated,
- neither requires a broad layout rewrite,
- both reduce annoyance quickly,
- both help validate current builder architecture before deeper feature work.

### Phase 2: Mid-scope builder workflow improvements
3. Expanded teams toggle. [done]
4. Support drag-replacing units between teams. [done]

Why next:
- both improve day-to-day builder usage,
- both build on the current multi-team foundation,
- both are easier to reason about once phase 1 polish is out of the way.

### Phase 3: Rule/interaction-heavy feature
5. Support-style duplicate allowance. [done]

Why later:
- this is a real rule-contract change, not simple UI.
- it touches uniqueness enforcement, picker disabled states, and likely import/export expectations.

### Phase 4: Optional deeper builder mode
6. Quick team planner mode. [done]

Why last:
- it is effectively a second assignment interaction model layered onto the existing builder.
- easy to overbuild if not isolated properly.

## Feature Notes

## 1) Covenant Slot Scaling Fix
### Intent
Fix the current covenant-slot SVG/path distortion on some device sizes.

### Likely ownership
- `src/pages/builder/*` for builder slot rendering if layout-class related
- `src/index.css` if purely scaling/CSS
- asset-level fallback only if CSS cannot solve it cleanly

### Approach
- First verify whether the distortion comes from SVG scaling inside a constrained box.
- Prefer CSS sizing/containment fix first.
- Only swap to static image assets if the SVG rendering remains unstable across browsers.

### Risk
- Low if CSS-only.
- Medium if asset replacement is needed.

## 2) Duplication Blocker Override Toggle
### Intent
Allow planner-only illegal teams like `4 Clem` without rewriting default rule behavior.

### Locked recommendation
- Default remains strict/on.
- Override is local UI state in builder only.
- Import/export should not silently normalize illegal teams.

### Ownership
- shared team-rule enforcement stays in domain
- builder view-model owns the toggle state and passes a relaxed-mode flag into rule checks

### Caveat
- Need explicit UX copy that this is a sandbox override, not valid in-game legality.

## 3) Expanded Teams Toggle
### Intent
Show a compact but fuller multi-team overview including wheels/covenants.

### Recommendation
- Make it a display mode toggle, not a separate builder.
- Preserve current compact row mode as default.
- Recommended first rendering pass: reuse the existing team-row ownership boundary and expand each slot into a stripped-down mini card:
  - portrait dominant
  - two wheel thumbnails
  - covenant shown as a small presence socket/icon
  - no names, levels, or enlighten text inside the row preview
- Keep the toggle in the teams menu as a simple `Compact | Expanded` pill.
- Phase A groundwork:
  - persist `compact|expanded` mode in builder view-model
  - wire toggle through `BuilderTeamsPanel`
  - do not change row rendering until the mode contract is stable

### Ownership
- builder page / team list rendering
- avoid duplicating assignment logic

### Caveat
- keep row/card rendering derived from the same team state to avoid drift

## 4) Drag-Replacing Units Between Teams
### Intent
Allow direct cross-team replacement interaction instead of forcing remove-then-add flows.

### Recommendation
- Implement only for awakeners first if needed.
- Reuse current move-confirm infrastructure rather than inventing a second transfer path.

### Risk
- Medium/high interaction complexity
- needs careful tests around faction caps, locked identities, and selection state

## 5) Support-Style Duplicate Allowance
### Intent
Mirror in-game “support”-style exception behavior for one duplicate unit.

### Locked rule contract
- Support is a slot-level flag on exactly one awakener slot across the entire multi-team build.
- Support only applies to the awakener slot itself.
- A support awakener may duplicate an awakener already used in another team.
- The support slot may also use duplicated wheels from other teams.
- Normal same-team duplicate rules still apply inside the support team:
  - the support awakener cannot duplicate an awakener already used in that same team
  - support wheels cannot duplicate wheels already used elsewhere in that same team
- Outside the one support slot, normal global duplicate rules stay strict.
- Removing or unflagging the support slot must return the build to strict legality.

### Locked UX direction
- Do not fold this into the existing `Allow Dupes` sandbox toggle.
- When a duplicate awakener placement is blocked under strict rules, and no support slot is currently used, offer a third placement resolution path:
  - `Use as Support`
- Choosing that path should:
  - place the duplicate awakener in the target slot
  - mark that slot as support
  - default the slot to high/maxed investment display
  - leave wheel slots empty by default
- Support needs a distinct badge:
  - full builder card: blue support badge
  - compact/expanded team list previews: shorter `Support` chip/badge

### Data / ownership
- Model support as `isSupport?: boolean` on `TeamSlot`.
- Do not create a fake second unit/entity type.
- “Whaled out” support investment should be derived display behavior, not stored as separate fake ownership state.
- Domain rule checks must own support legality.
- Builder UI should only surface the support placement decision and badge state.

### Import / export direction
- Internal multi-team export preserves support state in `mt1.` by storing the support flag in the slot level byte high bit.
- Old `mt1.` payloads remain backward-compatible because historical builder levels never used that bit.
- Do not bump versioning yet unless future slot metadata can no longer fit without making decode ambiguous.
- Single-team export does not need support metadata.
- In-game export cannot represent support metadata and should remain unchanged.

### Caveat
- This is still a real rule-contract change.
- It touches:
  - duplicate validation
  - move/placement resolution UI
  - builder card/list rendering
  - internal multi-team codec only if we decide support must persist through export/import now

## 6) Quick Team Planner Mode
### Intent
Fast click-to-fill assignment mode that iterates builder slots without manual targeting.

### Locked recommendation
- Treat this as a distinct interaction mode with explicit `Start / Finish / Cancel` state.
- Keep it scoped to the active team only.
- Prefer a team-slot iteration path, not a picker-tab pass:
  - `awakener -> wheel 1 -> wheel 2 -> covenant`
  - repeat for all 4 team slots
  - finish on team-level posse
- Do not use a global `Awakeners -> Wheels -> Covenants -> Posse` pass.
  - That fights the current builder ownership model and makes slot context harder to follow.
- Entering quick lineup should capture a snapshot of the current active team, then clear the active team for the quick pass.
  - This avoids duplicate/faction blocking from untouched future slots.
  - `Cancel` restores the full snapshot.
  - `Finish` keeps whatever the user has filled or explicitly skipped.
- `Not Set` remains a valid choice for:
  - wheel 1
  - wheel 2
  - covenant
  - posse
  and should advance the flow.
- Add explicit `Back` and `Skip` actions for the current step.
  - `Back` moves to the previous step and lets the user replace it.
  - `Skip` leaves the current step empty and advances.
- Invalid picks should behave like normal builder validation:
  - show the usual error feedback
  - do not advance
- Support manual slot jumping by normal card click only if it does not complicate the first ship.
  - Initial version can stay linear if that keeps the mode simpler and better tested.

### Ownership
- Builder view-model/hook owns:
  - quick-lineup mode state
  - current step index
  - snapshot restore
  - next/back/finish/cancel progression
  - post-mutation reconciliation after slot clears/swaps while quick lineup is active
- Active team panel owns:
  - the `Quick Team Lineup` trigger
  - in-mode action controls and live step/status text
- Selection panel remains the picker surface.
  - It should react to quick-lineup state by switching to the relevant picker tab automatically.

### Likely files
- `src/pages/builder/useBuilderViewModel.ts`
- `src/pages/builder/types.ts`
- `src/pages/builder/BuilderActiveTeamPanel.tsx`
- `src/pages/builder/BuilderSelectionPanel.tsx`
- likely a dedicated quick-lineup hook under `src/pages/builder/*`

### Risk
- High UX ambiguity if mixed into normal selection
- needs a separate contract for slot iteration and interruption/resume behavior

### Shipped notes
- V1 ships as a desktop-first linear flow below the active team panel.
- Step contract:
  - `Awakener -> Wheel 1 -> Wheel 2 -> Covenant` for each slot, then `Posse`
- `Start` snapshots and clears the active team.
- `Cancel` restores the full snapshot.
- `Finish` keeps the partial lineup.
- `Next` leaves the current step empty and advances.
- `Back` returns to the previous visited step.
- Manual slot clicks during quick lineup jump the iterator to that slot.
- Slot clears/swaps now reconcile through the quick-lineup session instead of ad hoc selection changes.

## Proposed Deliverables for This Branch
- Phase 1 plan and implementation first:
  - covenant slot scaling fix [done]
  - duplication blocker override toggle [done]
- If phase 1 is clean and still low-churn, continue with:
  - expanded teams toggle [done]
  - support drag-replacing units between teams [done]

## Testing Expectations
- Covenant scaling fix:
  - lint + targeted builder integration sanity
- Duplication blocker override:
  - domain tests for relaxed uniqueness behavior
  - builder integration tests for picker/assignment behavior
- Expanded teams:
  - integration tests for toggle and rendering mode

## Branch Notes
- Working branch: `builder-qol-stage-2`
- Keep this branch focused on builder-only work.
- Do not fold mobile/compact UI into this scope.
