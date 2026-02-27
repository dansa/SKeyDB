# General website QOL / Fixes
- Better, more in depth filters for awakeners/wheels, things like rarity, roles tags, etc.
    - Relies on more information being added to the respective JSON files.
- Add more tooltips when hovering things, to either negate truncated text, or explain what the thing does.
- Develop some sort of simple "getting started" system + guide for each page, explaining features and whatnot help users navigate the sections.

# General website features
- [Done 2026-02-26] Smaller toolbar below header that contains "important" actions, eg export/import on builder, save/load on collection, etc.
- Properly timestamp changelog entries and small notice toast about major feature since last visit :eyes:

--- 

## Homepage QOL / Fixes
- 

## Homepage features
- Add a proper attribution/acknowledgement section where collaborators and contributors can be clearly listed. with username, any links they want to provide, and a short description of their contribution.

--- 

## Builder UI QOL / Fixes
- [Done 2026-02-26] Sidebar to quickly switch between teams.
- Weird scaling behavior on the covenant slots, lines on the svgs/paths seem to get squished on some devices?
    - Could simply replace with static image assets, but risk of pixelation/blurring when scaling up/down
- Allow one Duped character to mirror "Support" behavior ingame
- Toggle to disable "duplication blockers" to make a 4 Clem team. Could mess with import/exports though.

## Builder Features
- Biggest "win" is supporting the ingame export/import format, but that either requires a lot manual reverse engineering of the format, or help from game developers themselves.
- "Quick team planner" mode, lets you select awakeners, wheels by just clicking, will iterate slots 1-4 and 1-8 and quick assign regardless of current state.
    - Manually selecting a slot would start the iteration from that slot I guess.
- Mobile / compact browser-friendly UI. 
    - Selecting a slot will open a "popup" picker rather than utilizing the sidebar panel.
    - Active team will be a scrollable zone rather than # of columns changing.
    - fixed widths on stuff to prevent weird scaling.
- [Done 2026-02-26] "Preset team setups", eg select "Dtide mode" and it will quickly generate 10 empty teams, two for each wave, appropriately named.
    - Could tie into full teams import, where it will import all teams at once into said empty template.
- Expanded teams toggle, (compact but full-team cards that display wheels and covenants of the units)
- Support drag-replacing units inbetween teams
- URL Encoding so that one can in theory share skeydb/importcode and get a full team layout without imports etc,
  - Need to think a bit about this, so people dont accidentally click links and nuke their own setups
- Since we use localstorage we could theoretically let people save/load a couple planners on-site with their comps and team setups, would suck if one clears browser data though..
--- 

## Collection QOL / Fixes
- [Done 2026-02-24] Level option for awakeners is live with click-to-edit controls, numeric input, and clamp to Lv.1-90 (default Lv.60).
- [Done 2026-02-26] Capture scroll up/down to quickly bump/dump E levels on hovered item while `Shift` is held.
- [Done 2026-02-24] Better sorting/ordering options landed for collection and box export via shared sort controls/component.
    - awakener/wheels only 
    - Groud by Faction toggle (Chaos->Aeq->Caro->Ultra->Neutral)
    - Sort by Level, Rarity, Enlighten, alphabetically (dropdown menu probably), ascending/descending
    - ingame ordering "within" the sortings is Level->faction priority (if enabled)->rarity->index
- [Done 2026-02-26] Fix the confusing buttons, like the Set Owned/Unowned pair which togglers ownership on every thing currently displayed in the collection screen.
    - An Idea here is to have a sectioned off area with "batch action", that explains that every action will be applied to every item currently displayed in the collection screen.
    - Batch actions could include things like - Set owned, Set unowned, bump to +12/reset to +0, etc.
- [Done 2026-02-24] Display unowned toggle is available on collection filters (default on).
- [Half-done 2026-02-26] Consider if the current layout of sidebar filters and big grid of items is the best way to go, or a menu placed on top of the grid or something would make more sense.
    - With the addition of tabs, i think the layout works better, but I have yet to review the idea of a "top menu style" layout.
- [Done 2026-02-24] Box export flow now includes richer layout controls, rarity filtering for wheel exports, and hardened PNG export fallback behavior for Firefox/font issues.

## Collection Features
- Not much to expand here. Better filters, batch actions, and (maybe) a better page layout.
    - Better filters obviously rely on feat 1 of "general website qol".

--- 

## DB Features/Plans/Brainstorm for when we get to DB implementation
- Decide on scope of the DB, is characters, wheels, posses and covenants enough?
- Similar layout of the "old" database, pop-up when you click a character, with all relevant info like stats/skills/enlightens/whatnot in a neat format
    - Some tabs where we can place curated tings like good wheels/enlightens/covenants/skill levels (whatever feels relevant)
    - Perhaps long term when we get there and it feels worthwhile, a Teams tab that has some common/meta teams for the unit that one can send into the builder/ingame (if we ever get support for that working)
- "Smart" hoverables in text, description of a skill in the json could contain "Blah blah applies [spellbound]", which our DB then parses into displaying a custom text element that explains the mechanic in a tooltip when hovered/clicked.

