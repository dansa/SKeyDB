# Docs Guide

Last updated: 2026-03-04

This repo keeps current planning separate from historical snapshots.

## Current docs

- `docs/roadmap.md`
  - Current priorities and larger next passes.
- `docs/backlog.md`
  - Unscheduled ideas worth keeping around.
- `docs/plans/`
  - Active implementation plans only.
- `docs/notes/`
  - Design notes, migration notes, and status/reference docs.
- `docs/archive/`
  - Shipped or superseded plans, backlog snapshots, and old roadmap snapshots.
- `docs/templates/`
  - Lightweight starting points for plans and notes.

## Maintenance rules

- When an idea becomes real work, create a dated plan in `docs/plans/`.
- When that plan ships or is abandoned, move it to `docs/archive/plans/`.
- Keep completed items out of `docs/roadmap.md` and `docs/backlog.md`.
- Keep long-lived reasoning in `docs/notes/` so future plans can link to it instead of re-explaining it.
- Plans should be actively maintained while work is live:
  - update `Status`
  - update `Last updated`
  - keep `Progress Snapshot` honest
  - remove stale “in progress” text once the state changes
- Start from `docs/templates/plan-template.md` or `docs/templates/note-template.md` unless there is a clear reason not to.
