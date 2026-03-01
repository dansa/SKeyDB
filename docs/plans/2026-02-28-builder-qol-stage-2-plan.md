# Builder QOL Stage 2 Plan

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
3. Expanded teams toggle.
4. Support drag-replacing units between teams.

Why next:
- both improve day-to-day builder usage,
- both build on the current multi-team foundation,
- both are easier to reason about once phase 1 polish is out of the way.

### Phase 3: Rule/interaction-heavy feature
5. Support-style duplicate allowance.

Why later:
- this is a real rule-contract change, not simple UI.
- it touches uniqueness enforcement, picker disabled states, and likely import/export expectations.

### Phase 4: Optional deeper builder mode
6. Quick team planner mode.

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

### Open design questions
- Is the duplicate slot global-per-team, global-per-builder, or role-bound?
- Does it apply only to awakeners, or other identity blockers too?
- How should import/export represent or reject it before explicit codec support exists?

### Recommendation
- Do not implement until the UX contract is written down in concrete rules first.

## 6) Quick Team Planner Mode
### Intent
Fast click-to-fill assignment mode that iterates builder slots without manual targeting.

### Recommendation
- Treat this as a distinct interaction mode with clear on/off state.
- Do not blend its rules into default builder selection behavior.

### Risk
- High UX ambiguity if mixed into normal selection
- needs a separate contract for slot iteration and interruption/resume behavior

## Proposed Deliverables for This Branch
- Phase 1 plan and implementation first:
  - covenant slot scaling fix [done]
  - duplication blocker override toggle [done]
- If phase 1 is clean and still low-churn, continue with:
  - expanded teams toggle

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
