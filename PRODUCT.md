# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SKeyDB is for midcore-to-power Morimens players who want to look up roster, wheel, event, D-zone, collection, and team-planning information quickly. They are often comparing several entries at once, moving between browse and detail views, or checking a live game state while making build decisions.

Less experienced players should still be able to understand the structure without learning a private tool language first. Expert users should be able to scan dense pages, filter aggressively, and trust that the interface is maintained.

## Product Purpose

SKeyDB is an unofficial, non-commercial Morimens fan database and team planner. It turns scattered community knowledge into a practical product surface: database browsing, exact stats, timeline tracking, D-zone season inspection, collection tracking, and builder workflows.

Success looks like a player finding the right information or completing a planning task without fighting the UI. The product should feel more curated and intentional than a wiki, but quieter and more task-focused than a game portal.

## Positioning

SKeyDB brings detailed Morimens reference data and roster-aware planning together. Players can look up character skills, card effects, and exact stats at a chosen level, track their collection, and build or share a lineup using supported in-game team codes.

## Operating Context

Looking up characters and skills in the Database is a common reason to visit. Players search for a specific entry, follow references between related entries, or keep several details in view while comparing options. The Builder and Collection support longer planning sessions. Players also consult the Timeline for current and upcoming events and banners, and D-zone for season details.

## Evidence on Hand

- [Public database records and indexes](src/data/public-v3/) contain the entity data used by the reference surfaces.
- [Timeline event and banner data](src/data/timeline/) and [D-zone season data](src/data/dzone/) support schedule and season lookups.
- The [project README](README.md) describes the current tools and game-code support. The [asset notice](ASSET-NOTICE.md) records attribution and reuse boundaries for game-owned material.

## Product Principles

1. Give reference and planning equal weight when making product decisions. Keep routine lookups quick and make deeper planning easy to reach.
2. Use established Morimens terminology and make it easy to follow references between records.
3. Make current and upcoming events easy to distinguish, with clear timing and access to the relevant details.
4. Support detailed comparisons and filtering while keeping common tasks approachable for newer players.

## Brand Personality

Neat, game-adjacent, and trustworthy. The app should feel maintained by people who care about the game and the data, not like a cold admin tool or a decorative fan page.

The current facelift direction is set by the Timeline and D-zone pages: dark archival surfaces, sharp low-radius panels, amber serif hierarchy, compact controls, restrained realm glow, and enough art to make the game context present without drowning the task.

## Anti-references

- Generic SaaS dashboards with rounded cards, oversized hero stats, and abstract gradients.
- Bare wiki pages where everything has the same text weight and no interaction hierarchy.
- Flashy game portal layouts that make data harder to compare.
- Nested card stacks, especially page sections wrapped in decorative cards and then filled with more cards.
- Purple-blue AI gradients, glassy blur panels as a default, and decorative glow that does not communicate state or content.
- Mismatched component languages across pages, such as database chips, builder ownership pills, and Timeline selectors being used interchangeably.

## Design Principles

1. Prioritize scanability over spectacle.
2. Let game art and realm identity support the task, not own the page.
3. Use visual hierarchy to separate navigation, filtering, status, and results clearly.
4. Keep controls compact, tactile, and consistent inside each surface family.
5. Prefer page flow, rails, and purposeful panels over cards on cards.
6. Preserve expert density while keeping first-time paths legible.
7. Make the app feel maintained even while data and features are still evolving.

## Accessibility & Inclusion

Target WCAG 2.2 AA for product surfaces. Maintain keyboard access, visible focus, semantic buttons and links, readable contrast on dark backgrounds, and touch targets of at least 40 px on mobile when controls are repeated or densely clustered.

Respect `prefers-reduced-motion`. Motion should explain expansion, selection, or state changes; it should not make users wait for the product to become usable.

## Current App Surface Direction

These are the newer guidelines established by Timeline and D-zone. Use them as the working set for future redesigns of Builder, Collection, and other product surfaces unless a surface has a stronger local reason to diverge.

### Page Structure

- Use a full-bleed contextual masthead when a page has season, event, realm, or status context. `SeasonMasthead` is the current reference.
- Keep mastheads shallow. They introduce the page and expose the most important current state; they do not become landing-page heroes.
- Let page sections flow directly on the app background. Use panels for real interactive tools, not as wrappers around every section.
- Prefer rails, dividers, grouped controls, and compact headers over decorative card grids.

### Visual Language

- Base surfaces live in deep blue-slate OKLCH neutrals: app night, panel night, and stronger panel night.
- Amber-gold is the primary accent for active state, current selection, page identity, and important headings.
- Realm color is a local aura or tint, not a global palette reset. It can tint masthead art, D-zone headers, card borders, and emblem glow.
- Shape is sharp and game-adjacent. Product panels and chips use 2-3 px corners. Rounded pills are local to older builder or collection controls until redesigned.
- Shadows are restrained and structural. Prefer inset hairlines, tonal layering, and hover lift over heavy elevation.
- Text on artwork may use translucent dark overlays and backdrop blur when it needs legibility. The Timeline banner card is the reference: a soft 2 px blur for the static title plaque, and a stronger 10 px blur plus dark gradient for the details drawer. This is a text-on-art tool, not a general panel material.

### Typography

- `Droid Serif` is an earned display and title voice for names, season titles, page names, and card titles that benefit from game flavor.
- Sans text is used for controls, metadata, dense descriptions, numbers, filters, and data.
- Uppercase labels are small, high-weight, and tracked. They should identify controls or metadata, not decorate empty space.
- Numbers and stat rows stay sans, medium weight, and tabular where useful. They should not compete with names.
- Do not overuse Droid Serif. Timeline and D-zone intentionally lean away from using it everywhere: labels, controls, descriptions, taxonomy, stats, prices, and most metadata stay sans unless there is a specific visual reason.

### Controls

- Controls should be obviously clickable without looking like generic web buttons.
- Segmented controls use shared borders and active amber fill or glow.
- Filter and display controls should wrap naturally on mobile. Avoid select fallbacks unless the native control is truly the better interaction.
- Focus states use amber outlines or rings. Never remove focus without replacing it with an equally visible treatment.

### Motion

- Use short 150-230 ms transitions with `cubic-bezier(0.22, 1, 0.36, 1)` or `cubic-bezier(0.25, 1, 0.5, 1)`.
- Animate state changes, disclosure, hover response, and minor content reveal.
- Disable transitions and animations under `prefers-reduced-motion`.

## Database Browse Conventions

These are settled decisions for the `/database` scope. New work in this section should match until the database surface is intentionally redesigned.

### Chip Vocabulary

- Corners: `rounded-[2px]`. Never `rounded-md` or `rounded-lg`.
- Border: `border border-slate-700/70` inactive, amber overlay when active.
- Background: `bg-[linear-gradient(180deg,rgba(13,20,34,0.9),rgba(8,13,24,0.84))]` for slate surfaces, amber gradient when active.
- Hover: `hover:border-slate-500/70`.
- Focus-visible: chip-like buttons use `focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`.
- Form controls use `focus:border-amber-300/60`; border-only focus avoids clashing with select chrome.
- Height: form controls and chips are `h-10 sm:h-8`. Tabs are `min-h-11 sm:min-h-10`.
- Text: `text-[11px] leading-none text-slate-200`.
- Use `CatalogFilterChipButton` from `DatabaseChipPrimitives.tsx` for opt-in filter dimensions. Use `DatabaseSortControls` for the sort select and direction button pair.

### Section Navigation

- Use underline tabs on a rail, not a pill.
- The `<nav>` has `border-b border-slate-700/45` as the baseline rail.
- Each tab is a `NavLink` with `-mb-px border-b-2`, title case, `text-sm sm:text-base font-semibold`.
- Active: `border-amber-300/80 text-amber-100`. Inactive: `border-transparent text-slate-400`.
- Let tabs extend by `flex-wrap`. Do not hard-code column counts.
- No wrapping pill container and no `DATABASE` masthead word. The tabs themselves carry structural weight.

### Results Meta Row

- Keep count and view controls together without an outer card.
- Layout: `flex flex-wrap items-center gap-x-4 gap-y-2`. Cluster gaps should be larger than inner gaps so boundaries read without dot separators.
- Count format: `N awakeners` or `N wheels` when unfiltered, `N of M` when filtered.
- Sort and group are display preferences. Filters live in the chip rows below.

### Filter State UX

- `ActiveFilterChips` renders above the grid when any filter dimension is non-default.
- Active chips are amber and include an `x`; the strip ends with `Reset all`.
- `resetFilters` must be a single `commitBrowseState` patch with all filter fields. Chaining setters hits a `searchParams` closure trap and only the last one wins.

### Card Typography

- Name is the amber serif primary: `font-["Droid_Serif"] font-bold text-amber-50`.
- Stats are sans `font-medium tabular-nums text-white/85`. Never serif, never bold.
- No `min-h-[Nrem]` reserves on text boxes. Let content be natural height and let the bottom anchor handle alignment.
- Stat icon tints for CON, ATK, and DEF reuse `heal`, `damage`, and `shield` from `@/domain/awakeners-text-colors`.

### Grid Card Frame

Both awakener and wheel cards delegate outer structure to `DatabaseGridCardFrame`: realm tint frame, aspect, hover lift, art, fade, button overlay, and corner slot. Each card owns only its overlay content.

### Module Map

- `DatabaseChipPrimitives.tsx`: `CatalogFilterChipButton`, `CatalogChipFilterRow`, `CatalogRealmFilterRow`, `CatalogFilterRow`, `CatalogMobileFilterGroup`, and internal `chipClass`.
- `DatabaseSearchInput.tsx`: search input with sr-only label and 40/44 px height.
- `DatabaseSortControls.tsx`: sort-key select and direction chip as a matched pair.
- `DatabaseEntityTabs.tsx`: underline navigation.
- `DatabaseGridCardFrame.tsx`: shared card shell.
- `ActiveFilterChips.tsx`: active-filter strip and `Reset all`.
- `database-active-filter-chips.ts`: `buildAwakenerActiveFilterChips` and `buildWheelActiveFilterChips`.
- `database-browse-state.ts`: enum constants and `getTypeFilterLabel`.

### Database Do Not

- Do not reach for `TogglePill` or `ownership-pill-builder` inside `/database`.
- Do not go through `<Button variant='secondary'>` for sort or filter chrome in the database.
- Do not use the removed `<select>` mobile fallback pattern for filter rows.
- Do not wrap the browse section in an outer card.
- Do not invent a second stat palette.
