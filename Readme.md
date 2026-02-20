## Morimens Teambuilder Proof of Concept

This is a proof of concept for a Morimens Teambuilder.

What we want to accomplish:
- Display a list of characters, with their name, image, "element".
- Searchable/filterable list of characters.
- Optionally let user mark characters as owned/unowned.
- Let user increase numbers of "dupes" for each character, Exalt 1-3 and then Over Exalt 1-12 (same system, it just changes from E to OE at +4)
- Let user build 1-10 teams with said characters, every character can only be picked once total. One character can theoretically be picked twice as you can hire one support from a friend per run.

- At some point, either when teams are "finished", or during building, we need to let user pick Wheels. These are "weapons", each character can equip 2 wheels, so each team can have 8 total.
- Optionally, we support covenants, these are "armor sets" more or less. (later probably)
- Teams should support Posse selection (team-wide ultimate), with global uniqueness across all teams.

- Neat way to export your team comp as url, so you can share it with others.
- Ideally in a cleaner way than "state=07,24,51,06;26,09,47,12;32,05,20,48;45,36,40,25;46,02,15%7C00,01,10,11,13,17,18,19,21,23,28,33,35,37,38,39,41,42,44,49" (or something like that)
- Can ideally be hosted on GitHub Pages or Cloudflare Pages (though limits might bite us in the behind for CF, unsure).
- Will be an open source, community contributed project so codebase needs to be clean, well documented and easy to navigate and understand.
- Should be easy to do pull requests to add new characters, wheels, and such, even for less experienced "coders".

- Optionally, we can provide a "database" for characters, including their stats, skills, what each dupe gives, recommended wheels/covenants, level upgrades, etc.
- Tags for characters, eg counter, poison, vulnerability, etc.
- Let users search for characters by name, element, tags, etc.

## Tech-stack
- Probably typescript
- Not sure about other dependencies, but we could use frameworks for the frontend and css.
- Since likely hosted without, or very limited backend no need to consider a bunch of dependencies for that.


## Styling
- We should try to keep it simple and clean, Probably darker colors and muted tones.
- Easy to navigate and use, clean layout and UX that makes sense.

## Builder UX Notes (Implementation Reference)
- In character/wheel pickers, entries that are already in use should remain visible and selectable.
- Used entries should be clearly marked (for example dimmed/grayscale with an "in use" indicator).
- Selecting an in-use entry should open a confirmation prompt/toast to move it from current assignment:
  - Example: "Move from Team X / Unit Y to Team A / Unit B?"
- Confirming should perform an atomic move (remove old assignment and apply new assignment together).
- Canceling should leave current assignments untouched.

- Character database should support "suggested wheels" and "suggested covenants" for each unit.
- Builder should support an autofill action that applies suggestions with these rules:
  - Wheels: only autofill suggested wheels that are not already in use elsewhere.
  - Covenants: no global uniqueness limit; covenants can be autofilled even if reused.
- Posse should be sourced from dedicated data JSON and enforced as globally unique across all teams.

- Builder card visual direction:
  - Tall, Morimens-like character cards using responsive ratio-based sizing.
  - Character name displayed at the top of the card.
  - Wheels rendered inside the character card near the bottom.
  - Empty slot card shows centered plus icon and "Tap to Deploy".
  - Filled card remains clickable for unit selection; wheel tiles are clickable for wheel picker.


