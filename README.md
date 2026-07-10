# SKeyDB

Unofficial, non-commercial Morimens fan database and team planner web app.

Live site:
- https://dansa.github.io/SKeyDB/

SKeyDB's source code is open source, while original SKeyDB data/content is available for non-commercial community reuse. Game assets and other game-owned material are not licensed by SKeyDB. See [Licensing](#licensing).

## Tech Stack
- React 19 + TypeScript
- Vite 8
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
- `npm run test:unit` - fast domain and utility regression pass
- `npm run test:integration` - builder-heavy interaction regression pass
- `npm run test:quick` - small collection/UI smoke suite
- `npm run test:watch` - run tests in watch mode
- `npm run lint` - run native Oxlint with type-aware TypeScript and React checks
- `npm run doctor:check` - check changed React code with React Doctor
- `npm run format:check` - check formatting without mutating files
- `npm run verify` - run formatting, Oxlint, React Doctor, tests, asset checks, and production build

Tracked data artifacts are committed to the repo and consumed directly by the app. Contributor-facing commands in this README are intended to work from a fresh clone.

## Project Structure
- `src/pages/` - route-level page shells and overview content
- `src/features/` - database, builder, collection, and timeline feature surfaces
- `src/stores/` - persisted and cross-surface UI state
- `src/data-access/` - public-data repository boundary and generated-data access
- `src/domain/` - domain logic, codecs, search, normalization, formulas, and asset helpers
- `src/data/` - tracked frontend-ready data artifacts
- `scripts/` - public-safe data compilers, sync helpers, and repo tooling
- `docs/` - roadmap, backlog, notes, archive, and templates (see `docs/README.md`)

## Licensing

SKeyDB uses separate licenses for separate parts of the project:

- Source code is licensed under the MIT License.
- SKeyDB-original data compilations, normalized datasets, calculations, annotations, documentation, guide text, notes, and other original written content are licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International.
- Morimens, Qookka Games, game logos, character art, portraits, card art, screenshots, in-game assets, exact game-owned text, and other third-party material are not licensed by SKeyDB.

See:

- [LICENSE.md](LICENSE.md)
- [DATA-LICENSE.md](DATA-LICENSE.md)
- [ASSET-NOTICE.md](ASSET-NOTICE.md)
- [CONTRIBUTING.md](CONTRIBUTING.md)

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


## Attribution And Other Contributions
- Posse images are currently - and Awakener avatars/cards were previously - sourced from Morimens HuijiWiki community pages:
  - https://morimens.huijiwiki.com/p/1
- HuijiWiki content for these assets is credited under CC BY-NC-SA:
  - https://creativecommons.org/licenses/by-nc-sa/4.0/
- Big thanks to the Huiji contributors for putting those resources, and a lot of other information together. It helped us get going a lot quicker than we would have otherwise.


## Asset & IP Notice
- SKeyDB is an unofficial, non-commercial fan project.
- `Morimens`, related logos, character art, portraits, card art, screenshots, in-game assets, in-game text, and other game-owned material are owned by Qookka Games and/or their licensors.
- No endorsement or affiliation with Qookka Games is implied.
- These materials are not licensed by SKeyDB. Reusers must obtain their own permission or legal basis before using them.
- If a rights holder requests removal or adjustment of any asset or content in this repo, it should be handled promptly.

Reference legal pages:
- https://account.qookkagames.com/service.en-US.html
- https://agreement.qookkagames.com/qookka/webshop-user-agreement/en/agreement.html

## Current App Surfaces
- `Overview` - project status, recent changelog, contributor acknowledgements, and public resource links
- `Database` - awakener filters, ranked search, deep-linked detail routes, exact level 1-90 stat scaling, cards/guide/build tabs, and interactive reference popovers
- `Timeline` - current and upcoming event/banner tracking
- `Builder` - multi-team planning with drag/drop, realm rules, quick-lineup helpers, compact `t1.` / `mt1.` codes, and in-game `@@...@@` codec support
- `Collection` - owned/unowned tracking, dupe/enlighten progress, collection sorting, and snapshot export/import

For current priorities and unscheduled ideas, see:
- `docs/README.md`
- `docs/roadmap.md`
- `docs/backlog.md`
