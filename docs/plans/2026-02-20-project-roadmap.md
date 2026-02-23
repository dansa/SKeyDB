# SKeyDB Roadmap

Last updated: 2026-02-23

## Project Goal
Ship an open-source Morimens team builder that is easy to use and easy to maintain.

## Current Scope Snapshot

### In (implemented now)
- Builder page with Morimens-inspired card layout.
- Team editor with 4-slot active team view.
- Multi-team planner foundation (up to 10 teams):
  - add/delete team,
  - active-team switching via team row click,
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
  - cross-team uniqueness checks for awakeners, wheels, and posses.
- Wheels:
  - searchable wheel picker with rarity filters,
  - drag/drop assign/swap/remove in card slots,
  - active-slot + active-awakener assignment flows,
  - cross-team uniqueness checks with move confirmation.
- Covenants:
  - searchable covenant picker,
  - drag/drop assign/swap/remove,
  - active-slot + active-awakener assignment flows,
  - included in compact import/export (`t1.` / `mt1.`).
- Automated tests for domain logic and key builder behavior.
- Import/export:
  - versioned compact codes (`t1.` / `mt1.`),
  - single-team and multi-team export actions,
  - import dialogs with replace and duplicate strategy handling.
- Local persistence:
  - builder draft autosave/restore,
  - builder reset + undo flow.
- Collection page:
  - owned/unowned tracking for awakeners, wheels, and posses,
  - `E` level controls for awakeners/wheels,
  - quick-toggle filtered results,
  - save/load collection snapshot (`.json`).

### Partially in (scaffolded / placeholder)
- Some wheel metadata fields are intentionally unfinished for future data enrichment:
  - `awakener`,
  - `mainstatKey` descriptions/display metadata linkage.
- Covenant metadata quality (naming/details) is still an ongoing data pass.

### Out (not implemented yet)
- Expanded teams toggle (compact full-card previews for all teams).
  - Plan reference: `docs/plans/2026-02-20-multi-team-builder-plan.md`
- Expanded ownership features (bulk tooling polish, future sync UX).
- Exalt / Over-Exalt progression controls.
- Shareable URL encoding.
- Character/wheel/covenant deep database (stats, skills, tag taxonomy, recommendations).

## Near-Term Milestones

### Milestone 1: Complete Core Builder Loop
- Completed:
  - wheel selection/assignment in active team cards,
  - wheel uniqueness + move confirmation behavior,
  - covenant selection/assignment in active team cards.
- Next:
  - metadata enrichment for wheels/covenants (mainstat/awakener link quality).

### Milestone 2: Multi-Team Iteration 2
- Add optional expanded teams view (small full-card previews per team).
- Continue conflict/move UX polish for reassignment flows.
- Detailed plan: `docs/plans/2026-02-20-multi-team-builder-plan.md`

### Milestone 3: Share + Persistence
- Expand compact export/import coverage (future schema versions, compatibility policy).
- Add URL-safe share format (or alternative share string flow).
- Investigating: A proper way to support import and export strings from/to the game client itself
- Completed: local persistence for builder drafts.
- Completed: owned/unowned collection persistence (awakeners, wheels, posses) on dedicated collection UI.
- Pending: migration scaffolding for future persistence schema versions.
- Detailed plan: `docs/plans/2026-02-22-persistence-plan.md`

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
