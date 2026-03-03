# Database Split Notes

## Goal

Capture the current findings for the upcoming database work so we do not have to re-argue the same data-loading boundaries later.

Date:

- March 2, 2026

## Current Observation

- `src/data/awakeners-lite.json` is already large enough that it should stop being treated as the future home for every detail field.
- The upcoming DB page UX has a clear two-stage interaction model:
  - overview page with filters/sorting/search
  - click-through modal with richer detail content

That makes this a usage-boundary split, not just a file-size split.

## Recommended Data Shape

### 1. Keep a true `lite` dataset

`lite` should contain only the fields required to render overview/list/filter/sort/search surfaces without an extra fetch.

For awakeners, that currently means:

- `id`
- `index`
- `name`
- `aliases`
- `realm`
- `faction`
- `rarity`
- `type`
- `tags`
- concise stats needed for actual list operations

The intent is:

- builder
- collection
- search
- future DB landing page
- overview sorting/filtering

all continue to work from one small operational dataset.

### 2. Add a separate `full` dataset

`full` should hold detail-modal data only.

For awakeners, that includes:

- skill descriptions
- passive text
- awaken node/enlighten text
- long-form stat block
- profile/lore/detail copy
- any rich text or tabbed modal content

This data should not be required for builder, collection, or list-page boot.

## Awakener Split Decision

### `awakeners-lite.json`

Keep:

- identity
- taxonomy
- search tags
- overview-relevant stats

Do **not** keep:

- long skill text
- long profile text
- rich/tabbed modal copy
- display-only stat annotations that are not used for overview operations

### `awakeners-full.json`

Add:

- full stat block
- skill text
- rich descriptions
- future modal-tab content

The recommended first step is one aggregated `awakeners-full.json`, not per-awakener files.

Reason:

- simpler loading contract
- fewer requests
- easier maintenance
- still keeps the overview page off the rich payload

## Stat Handling Rule

The current stat blocks are display-oriented strings, for example:

- `CON: "95"`
- `CritDamage: "65% (+2.4%)*"`
- `RealmMastery: "12 (+2)*"`

Recommended split:

### In `lite`

Only keep normalized stats that are actually useful for overview sorting/filtering.

Likely examples:

- `ATK`
- `DEF`
- `CON`
- optionally `CritRate` / `CritDamage` if the DB page really plans to sort/filter by them

These should ideally be numeric operational values, not rich display strings.

### In `full`

Keep the complete display-oriented stat block, including annotations, percentages, growth markers, and anything else needed by the modal.

This avoids turning `lite` back into a disguised full DB payload.

## Wheel Split Notes

The same split pattern will probably be needed for wheels.

Why:

- wheels are already data-heavy
- future wheel DB/detail surfaces will likely want richer text/metadata
- overview/filter/search needs are much smaller than full detail needs

Recommended direction:

- `wheels-lite.json`
  - identity
  - rarity
  - realm
  - awakener
  - main stat
  - any search/sort tags actually needed on the list surface
- `wheels-full.json`
  - future detail text, recommendations, extended descriptions, etc.

This is not fully specified yet, but the architectural direction should match awakeners.

## Posse and Covenant Notes

Current expectation:

- posses and covenants may not need a `full` split immediately
- their rich content is expected to be much smaller than awakeners/wheels

Working assumption for now:

- keep posses and covenants as `lite` only unless the actual detail payload grows enough to justify a second file

This is intentionally a provisional call, not a hard rule.

## Automation Recommendation

When `full` datasets are introduced, maintainers should not hand-build new rich objects from scratch.

Recommended workflow:

1. maintainer adds new entry to `*-lite.json`
2. run sync command
3. command creates missing `full` entry skeletons
4. maintainer fills in the rich fields manually

For awakeners, this likely becomes:

- `npm run data:sync-awakener-full`

Expected behavior:

- copy canonical identity fields from lite
- generate empty/default placeholders for rich sections
- preserve existing full entries
- fail CI if a lite entry is missing a matching full entry

## Non-Goals Right Now

These findings do **not** decide:

- final DB page component structure
- modal layout details
- backend/API design
- CDN/image hosting strategy
- per-entry lazy loading

Those belong to the actual DB implementation plan.

## Current Recommendation Summary

1. Split awakeners into:
- `lite`
- one aggregated `full`

2. Likely do the same for wheels.

3. Keep posses and covenants as `lite` only unless real content proves otherwise.

4. Keep `lite` focused on:
- overview rendering
- sorting
- filtering
- search
- operational app behavior

5. Keep `full` focused on:
- click-through modal detail content

6. Add sync automation for generating missing `full` skeletons from `lite`.
