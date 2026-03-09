# SKeyDB

Unofficial Morimens database and team planner web app (community project, running name: SKeyDB).

Live site (stable beta, actively developed):
- https://dansa.github.io/SKeyDB/#/builder

## Tech Stack
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- Zustand + Immer (state)
- Zod (schema validation)
- Fuse.js (fuzzy search)
- dnd-kit (drag and drop)
- Vitest + Testing Library

## Quick Start
```bash
npm install
npm run dev
```

App runs on `http://127.0.0.1:5173`.

## Scripts
- `npm run dev` - start local dev server
- `npm run build` - type-check + production build
- `npm run preview` - preview built app
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - run ESLint

## Project Structure
- `src/pages/BuilderPage.tsx` - main builder page
- `src/pages/builder/` - builder UI components + DnD logic
- `src/domain/` - domain logic (search, rules, formatting, assets)
- `src/data/` - lightweight JSON datasets
- `docs/` - internal roadmap, backlog, plans, notes, and archive
- `untracked/` - local scratch space (ignored by git)

## Contributors
- `DZ-David`, Original database and team builder, which some of our data originates from.
- `V`, Project management, data help/cleanup and a whole lot of other things
- `Zekiel`, Data collection/help, anti-tawil propaganda in my DMs + more
- `Ansu`, Migration and restructuring of awakener json db, plus a lot of work on the
  codebase.
- `Juno`, Made the website icon and is working on our logo
- `Happy`, Working on our logo
- `Jynn`, Invaluable help with awakener scaling mathematics, and is the actual source of
  most our database text content.
- `Fish`, Collected and mapped out every covenant slice (and more) in the game, so that
  our export codes actually work as they should.
- `Frosthief`, Also helped out a lot with collecting wheel mappings and more for the
  export codes.
- Everyone else who has, or will, provide feedback, suggestions, or other contributions
  to the project.


## Attribution & Other contributions
- Posse images are currently - and Awakener avatars/cards were previously - sourced from Morimens HuijiWiki community pages:
  - https://morimens.huijiwiki.com/p/1
- HuijiWiki content for these assets is credited under CC BY-NC-SA:
  - https://creativecommons.org/licenses/by-nc-sa/4.0/
- Big thanks to the Huiji contributors for putting those resources, and a lot of other information together. It helped us get going a lot quicker than we would have otherwise.


## Asset & IP Notice
- SKeyDB is an unofficial, non-commercial fan project.
- `Morimens`, related logos, character art, portraits, card art, and other in-game assets are owned by Qookka Games and/or their licensors.
- No endorsement or affiliation with Qookka Games is implied.
- If you plan to reuse game assets in another project (especially commercial use), obtain permission from the rights holder first.
- If a rights holder requests removal of any asset or content in this repo, it should be removed promptly.

Reference legal pages:
- https://account.qookkagames.com/service.en-US.html
- https://agreement.qookkagames.com/qookka/webshop-user-agreement/en/agreement.html

## Current Scope
Current implementation is an MVP focused on:
- awakener picker/search
- team card interactions and drag/drop
- wheel picker/search + assignment flows
- covenant picker/search + assignment flows
- realm constraints and related UX states
- posse selection UI
- compact import/export codes (`t1.` single-team, `mt1.` multi-team)
- import conflict handling (replace, move duplicates, skip duplicates)
- local builder draft persistence (autosave/restore)
- collection ownership page (owned/unowned + dupe levels)
- collection save/load snapshot (`.json`)

For roadmap/todo details, see:
- `docs/roadmap.md`
- `docs/backlog.md`
