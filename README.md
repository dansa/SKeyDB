# SKeyDB

Morimens team builder web app (community project, running name: SKeyDB).

Live builder (in development):
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
- `docs/plans/` - internal planning/roadmap docs
- `untracked/` - local scratch space (ignored by git)

## Deployment Notes (GitHub Pages)
This project can be deployed to GitHub Pages as a static site.

Routing is configured with `HashRouter`, so client-side routes work on GitHub Pages without server rewrites.

Set the repo base path at build time with `VITE_BASE_PATH`:

```bash
# example for https://<user>.github.io/SKeyDB/
$env:VITE_BASE_PATH='/SKeyDB/'
npm run build
```

If deploying to a user/org root page (`https://<user>.github.io/`), you can keep the default `/` base.

## Asset & IP Notice
- This is an unofficial, non-commercial fan project.
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
- faction constraints and related UX states
- posse selection UI scaffold
- compact import/export codes (`t1.` single-team, `mt1.` multi-team)
- import conflict handling (replace, move duplicates, skip duplicates)

For roadmap/todo details, see:
- `docs/plans/2026-02-20-project-roadmap.md`
