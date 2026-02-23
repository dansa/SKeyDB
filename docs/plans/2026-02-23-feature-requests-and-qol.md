# General website QOL / Fixes
- Better, more in depth filters for awakeners/wheels, things like rarity, roles tags, etc.
    - Relies on more information being added to the respective JSON files.
- Add more tooltips when hovering things, to either negate truncated text, or explain what the thing does.
- Develop some sort of simple "getting started" system + guide for each page, explaining features and whatnot help users navigate the sections.

# General website features
- Smaller toolbar below header that contains "important" actions, eg export/import on builder, save/load on collection, etc.

--- 

## Homepage QOL / Fixes
- 

## Homepage features
- Add a proper attribution/acknowledgement section where collaborators and contributors can be clearly listed. with username, any links they want to provide, and a short description of their contribution.

--- 

## Builder UI QOL / Fixes
- Sidebar to quickly switch between teams.
- Weird scaling behavior on the covenant slots, lines on the svgs/paths seem to get squished on some devices?
    - Could simply replace with static image assets, but risk of pixelation/blurring when scaling up/down

## Builder Features
- Biggest "win" is supporting the ingame export/import format, but that either requires a lot manual reverse engineering of the format, or help from game developers themselves.
- "Quick team planner" mode, lets you select awakeners, wheels by just clicking, will iterate slots 1-4 and 1-8 and quick assign regardless of current state.
    - Manually selecting a slot would start the iteration from that slot I guess.
- Mobile / compact browser-friendly UI. 
    - Selecting a slot will open a "popup" picker rather than utilizing the sidebar panel.
    - Active team will be a scrollable zone rather than # of columns changing.
    - fixed widths on stuff to prevent weird scaling.
    - Mobile UI kinda ties into quick team planner mode where that feature might be more useful than on desktop.
- "Preset team setups", eg select "Dtide mode" and it will quickly generate 10 empty teams, two for each wave, appropriately named.
    - Could tie into full teams import, where it will import all teams at once into said empty template.

--- 

## Collection QOL / Fixes
- Fix the confusing buttons, like the Set Owned/Unowned pair which togglers ownership on every thing currently displayed in the collection screen.
    - An Idea here is to have a sectioned off area with "batch action", that explains that every action will be applied to every item currently displayed in the collection screen.
    - Batch actions could include things like - Set owned, Set unowned, bump to +12/reset to +0, etc.
- Add back the display unowned/owned toggle for filters, in case people want to easily filter things they own and what they don't.
- Consider if the current layout of sidebar filters and big grid of items is the best way to go, or a menu placed on top of the grid or something would make more sense.

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

