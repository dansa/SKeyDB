# Builder V2 Designer Handoff

Status: C9 handoff bundle
Prepared: 2026-05-22
Route: `/builder-v2`
Audience: UI designer or design-focused model

## Purpose

Builder V2 is now a local product baseline. It is not the visual destination.

The implementation proves the Builder workflow can live outside the old `/builder` UI debt: teams, slots, equipment, picker, quick-lineup, import/export, transfer confirmation, adaptive layout, and mobile flow are all present enough that a designer can focus on making the experience feel good.

The selected concept images are the visual target. Treat the current `/builder-v2` captures as a functional map of what exists, where the workflow pressure is, and which states need design treatment.

## Source Hierarchy

1. Target direction: `../../design/Desktop.png`, `../../design/Mobile.png`, `../../design/Mobile-QuickLineup.png`.
2. Product baseline: the current `/builder-v2` implementation and screenshots in `artifacts/`.
3. Design language: `../../../DESIGN.md`, `../../../PRODUCT.md`.
4. Broader research packet: `../../design/oracle-sendoff.md`.
5. Current V1 builder: functionality reference and anti-anchor only. Do not copy its layout or visual language.

## Screenshots

### Target Mockups

Use these as the intended visual and layout destination:

- `../../design/Desktop.png`
- `../../design/Mobile.png`
- `../../design/Mobile-QuickLineup.png`

### Current Product Baseline

Use these to understand what the local Builder V2 currently exposes:

- `artifacts/builder-v2-current-browser-desktop-filled.png`: Browser-plugin capture of the current desktop baseline with a partially filled team active.
- `artifacts/builder-v2-current-browser-desktop.png`: Browser-plugin capture of the current desktop baseline in an empty active-team state.
- `artifacts/builder-v2-current-adaptive.png`: local viewport capture at 900 x 1000.
- `artifacts/builder-v2-current-mobile.png`: local viewport capture at 390 x 844.

The baseline screenshots are intentionally not polish references. They show working regions, functional density, and missing design hierarchy.

## Locked Product Behavior

The designer should not need to rediscover or redesign these contracts:

- `/builder-v2` remains isolated and unpromoted. `/builder` remains protected.
- A draft supports up to 10 teams.
- Each team has 4 awakener slots and an optional posse.
- Each awakener slot has an awakener, level, support state, 2 wheel slots, and 1 covenant slot.
- The active team can be switched, renamed, reset, deleted, reordered, exported, and templated.
- D-Tide 5 and D-Tide 10 templates exist.
- The picker supports Awakeners, Wheels, Covenants, and Posses.
- Assignment, replacement, clearing, same-team movement, duplicate prevention, ownership projection, and transfer confirmation are product behavior, not visual experiments.
- Quick Lineup exists as a guided fill mode.
- Mobile has an app-like overview/focused/picker flow.
- Adaptive/tablet behaves like a pseudo-desktop surface with constrained width and a drawer-style picker.

## Visual Goal

The end goal should feel like the selected mockups translated into the current SKeyDB product language:

- Dark, sharp, compact tool surface.
- Less blue saturation than the old Builder.
- Amber used for active state, focus, current identity, and important headings.
- Realm color as local aura or content tint, not a global wash.
- Low-radius product geometry, roughly 2-3px.
- Dense controls that still feel tactile.
- Art visible enough to make the game context present.
- Blur or glass only where it improves legibility over art or helps a true overlay/drawer.
- No decorative glass, generic SaaS cards, purple-blue AI gradients, nested card stacks, or oversized hero treatment.

## Layout Intent

Desktop should preserve the "I can see everything I need at once" expectation:

- Team navigation or team context visible.
- Active team and slot editing visible.
- Picker or armory visible.
- Current team management visible enough to understand and operate.
- Import/export/quick-lineup actions placed where they feel useful rather than noisy.

Mobile can feel like a real app inside the website:

- Full viewport use is acceptable.
- Overview, focused team editing, and picker drawer states should feel deliberate.
- Touch targets should remain usable even when density is high.
- The selected `Mobile.png` and `Mobile-QuickLineup.png` mockups should be the anchor.

Adaptive/tablet should feel like constrained desktop:

- Keep the active team prominent.
- Compact the teams surface.
- Use a drawer or similar treatment for the picker instead of forcing desktop side-by-side density.

## Team Overview Scope

The current team management surface is functional and provisional.

The designer may improve its hierarchy and screenshot friendliness, but the final list-vs-cards-vs-switcher decision can be a future-day problem. Do not let team presentation block the main Builder visual direction.

Minimum team surface behavior to preserve:

- Add team.
- Select active team.
- Rename team.
- Reset/delete team with appropriate confirmation.
- Reorder teams.
- Apply D-Tide templates.
- Show enough slot/posse state to understand a team at a glance.

## Deferred UX Mechanics

These should be named as future follow-up, not bundled into the first designer pass:

- Drag-and-drop reorder or cross-surface drag polish.
- Recommendation systems.
- Final team screenshot/share mode.
- Navigation promotion from hidden `/builder-v2` to public Builder.
- Persistence or migration changes.

## Designer Prompt

Use this prompt when handing the work to a design model or designer:

```text
You are redesigning the SKeyDB Builder V2 page.

Use these concept images as the target visual/layout direction:
- docs/design/Desktop.png
- docs/design/Mobile.png
- docs/design/Mobile-QuickLineup.png

Treat the current /builder-v2 screenshots and implementation as a product baseline only. They prove the required workflow and interaction states exist, but they are not the visual design to preserve. The end goal should move toward the mockups while staying inside the newer SKeyDB language from DESIGN.md and PRODUCT.md: dark archival surfaces, sharp low-radius panels, compact controls, amber active state, restrained realm aura, useful art, and no decorative glass or generic SaaS cards.

Design for three breakpoints:
- Desktop: everything important visible at once: teams, active team, slots/equipment, picker/armory, and key actions.
- Mobile: app-like full-viewport flow with overview, focused editing, quick-lineup, and picker drawer states.
- Adaptive/tablet: constrained desktop feel, compact teams, active builder prominent, picker in a drawer or similarly contained surface.

Preserve these product contracts:
- up to 10 teams
- 4 awakener slots per team
- 2 wheel slots and 1 covenant per awakener slot
- optional posse per team
- team add/select/rename/reset/delete/reorder/templates
- picker categories for awakeners, wheels, covenants, and posses
- quick-lineup mode
- import/export actions
- transfer confirmation semantics
- clear active selection/focus state

Do not solve deeper UX mechanics in this pass. DnD, recommendations, final share mode, and public nav promotion can be future work. The teams overview only needs to remain functionally represented; final list vs cards vs switcher can be deferred.

Deliver a polished visual/layout proposal that makes building a team feel obvious, fast, and satisfying. Prefer the selected mockups over the current product baseline whenever they conflict visually, but do not remove required Builder functionality.
```

## Acceptance Checklist

A good design proposal should answer:

- Does the desktop composition make the active team, picker, and teams context obvious at once?
- Does mobile feel intentionally app-like rather than stacked desktop leftovers?
- Does adaptive/tablet avoid both cramped desktop and oversized mobile patterns?
- Can a user tell what slot is active and what action will happen next?
- Are empty, filled, support, level, wheel, covenant, posse, and ownership states visually accounted for?
- Are import/export, quick-lineup, and team actions discoverable without dominating the page?
- Is the blue reduced compared with old Builder while preserving SKeyDB's dark sharp identity?
- Are amber and realm color used as state/content signals rather than decoration?
- Is the teams overview functional but not over-specified beyond this pass?

## Current Follow-Up Boundary

After the designer pass lands, revisit UX mechanics with the visual direction in place. DnD, recommendation polish, share/screenshot mode, and final team overview shape should be scoped as separate product slices.
