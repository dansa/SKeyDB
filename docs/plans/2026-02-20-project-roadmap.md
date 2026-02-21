# SKeyDB Roadmap

Last updated: 2026-02-21

## Project Goal
Ship an open-source Morimens team builder that is easy to use and easy to maintain.

## Current Scope Snapshot

### In (implemented now)
- Builder page with Morimens-inspired card layout.
- Team editor with 4-slot active team view.
- Multi-team planner foundation (up to 10 teams):
  - add/delete team,
  - explicit active-team switching (`Edit Team`),
  - inline rename,
  - drag reorder.
- Awakener picker:
  - click-to-add (first empty slot),
  - drag/drop assign/swap/remove,
  - fuzzy + alias search,
  - faction sub-filters,
  - disabled-state UX for in-use and faction-blocked units.
- Posse picker:
  - realm sub-filters,
  - search by name/realm/linked awakener alias,
  - set/unset active posse in builder UI,
  - cross-team move confirmation flow.
- Team rule enforcement in active editor:
  - max 2 factions per team,
  - violation toast feedback,
  - cross-team uniqueness checks for awakeners and posses.
- Automated tests for domain logic and key builder behavior.
- Import/export:
  - versioned compact codes (`t1.` / `mt1.`),
  - single-team and multi-team export actions,
  - import dialogs with replace and duplicate strategy handling.

### Partially in (scaffolded / placeholder)
- Wheels tab exists in picker UI, but wheel data + wheel selection flow is not wired.
- Covenants tab exists in picker UI, but covenant data + flow is not wired.
- Multi-team rule completion:
  - wheel global uniqueness is not yet enforced in live UI (pending wheel dataset wiring).

### Out (not implemented yet)
- Expanded teams toggle (compact full-card previews for all teams).
  - Plan reference: `docs/plans/2026-02-20-multi-team-builder-plan.md`
- Wheel assignment logic and wheel uniqueness in live UI (end-to-end).
- Covenant system and covenant filters/search.
- Owned/unowned tracking.
- Exalt / Over-Exalt progression controls.
- Shareable URL encoding.
- Character/wheel/covenant deep database (stats, skills, tag taxonomy, recommendations).

## Near-Term Milestones

### Milestone 1: Complete Core Builder Loop
- Implement wheel selection and assignment in active team cards.
- Implement wheel uniqueness + “move from other slot/team” behavior.
- Implement covenant selection and assignment in active team cards.

### Milestone 2: Multi-Team Iteration 2
- Complete wheel cross-team uniqueness enforcement.
- Add optional expanded teams view (small full-card previews per team).
- Continue conflict/move UX polish for reassignment flows.
- Detailed plan: `docs/plans/2026-02-20-multi-team-builder-plan.md`

### Milestone 3: Share + Persistence
- Expand compact export/import coverage (future schema versions, compatibility policy).
- Add URL-safe share format (or alternative share string flow).
- Optional local persistence for drafts.

## Milestone 4: Actual database
- Add character/wheel/covenant data with stats, skills, tag taxonomy, recommendations.
- Let users browse the database through filters and search.
- Look into "in builder" popups for characters/wheels/covenants/etc. with descriptions and other relevant info based on DB data.
- Add contribution docs for “how to add awakeners/wheels/posses safely”.

## UX Rules (Agreed Baseline)
- In-use entries remain visible in pickers.
- Blocked entries are still selectable/draggable, with clear feedback.
- Reassignments should be atomic (remove old + apply new in one action).
- Visual style remains sharp/squared and Morimens-inspired, with responsive ratios.

## Notes
- README is intentionally short/public-facing.
- This file is the internal working roadmap and can be detailed.
- Add an in-app legal footer/credits block for asset ownership attribution (Qookka Games + licensors).
- Future churn (UI consistency): migrate remaining builder action buttons (non-modal) to shared `Button` variants.
