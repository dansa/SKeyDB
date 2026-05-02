# Database Split Notes

Archived note: preserved as migration-era architecture context for the V1 to V2 database transition.

## Goal

Capture the current findings for the upcoming database work so we do not have to re-argue the same data-loading boundaries later.

Date:

- March 2, 2026

## Current Observation

- The old top-level `awakeners-lite.json` / `awakeners-full.json` split was a useful stepping stone, but the maintained path is now canonical `/awakeners` datasets plus compiled V2 artifacts.
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

### Historical `awakeners-lite.json`

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

### Historical `awakeners-full.json`

Add:

- full stat block
- skill text
- rich descriptions
- future modal-tab content

That recommendation has now been superseded by one compiled V2 full artifact derived from the split canonical `/awakeners` datasets.

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

- wheel lite public records
  - identity
  - rarity
  - realm
  - awakener
  - main stat
  - any search/sort tags actually needed on the list surface
- wheel full public records
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

When `full` datasets are introduced, avoid hand-building new rich objects from scratch.

Recommended workflow:

1. maintainer adds new entry to `*-lite.json`
2. run sync command
3. command creates missing `full` entry skeletons
4. maintainer fills in the rich fields manually

For awakeners, this was the interim idea:

- `npm run data:compile-awakeners-full-v2`

That workflow is now retired in favor of canonical split datasets plus compiled V2 artifacts, so we should not reintroduce writes back into a top-level `awakeners-full.json`.

## Non-Goals Right Now

These findings do **not** decide:

- final DB page component structure
- modal layout details
- backend/API design
- CDN/image hosting strategy
- per-entry lazy loading

Those belong to the actual DB implementation plan.

## Current Recommendation Summary

1. Keep awakeners in split canonical `/awakeners` datasets and derive compiled V2 runtime artifacts from them.

2. Likely do the same for wheels.

3. Keep posses and covenants as `lite` only unless real content proves otherwise.

4. Keep `lite` focused on:
- overview rendering
- sorting
- filtering
- search
- operational app behavior

5. Keep the compiled full artifact focused on:
- click-through modal detail content

6. Do not reintroduce sync automation that writes back into retired top-level full/lite blobs.
