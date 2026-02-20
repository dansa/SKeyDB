# MomenTB Roadmap

Last updated: 2026-02-20

## Project Goal
Ship an open-source Morimens team builder that is easy to use (copium), easy to maintain (surely), 

## Current Scope Snapshot

### In (implemented now)
- Builder page with Morimens-inspired card layout.
- Team editor with 4-slot active team view.
- Awakener picker:
  - click-to-add (first empty slot),
  - drag/drop assign/swap/remove,
  - fuzzy + alias search,
  - faction sub-filters,
  - disabled-state UX for in-use and faction-blocked units.
- Posse picker:
  - realm sub-filters,
  - search by name/realm/linked awakener alias,
  - set/unset active posse in builder UI.
- Team rule enforcement in active editor:
  - max 2 factions per team,
  - violation toast feedback.
- Domain validation helpers available for full plan rules:
  - max 10 teams,
  - duplicate awakener/wheel/posse checks.
- Automated tests for domain logic and key builder behavior.

### Partially in (scaffolded / placeholder)
- Wheels tab exists in picker UI, but wheel data + wheel selection flow is not wired.
- Covenants tab exists in picker UI, but covenant data + flow is not wired.

### Out (not implemented yet)
- Full multi-team planner (1-10 teams UI).
- Global uniqueness enforcement across all teams in live UI.
- Wheel assignment logic and wheel uniqueness in live UI.
- Covenant system and covenant filters/search.
- Owned/unowned tracking.
- Exalt / Over-Exalt progression controls.
- Import/export or shareable URL encoding.
- Character/wheel/covenant deep database (stats, skills, tag taxonomy, recommendations).

## Near-Term Milestones

### Milestone 1: Complete Core Builder Loop
- Implement wheel selection and assignment in active team cards.
- Implement wheel uniqueness + “move from other slot/team” behavior.
- Add posse “unset/default” polish and finalize active-team header interactions.

### Milestone 2: Multi-Team Planning
- Expand from single active team to 1-10 team planner.
- Enforce cross-team uniqueness for awakeners, wheels, and posses in UI.
- Add clear conflict/move UX for cross-team reassignment.

### Milestone 3: Share + Persistence
- Define compact export/import schema.
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


