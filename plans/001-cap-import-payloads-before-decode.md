# Plan 001: Cap Import Payloads Before Decode

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the next
> step. If anything in the "STOP Conditions" section occurs, stop and report -
> do not improvise. When done, update the status row for this plan in
> `plans/README.md` unless a reviewer told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ffe8f431..HEAD -- src/components/ui/ImportCodeDialog.tsx src/domain/import-export.ts src/domain/ingame-codec.ts src/domain/import-export.test.ts src/features/builder/useBuilderImportFlow.ts src/features/builder/BuilderPage.import-export.test.tsx src/features/builder-v2/BuilderV2Page.test.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current State" excerpts against the live code before proceeding; on mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `ffe8f431`, 2026-06-18

## Why This Matters

Builder import accepts user-pasted text and routes it into shared import decode
logic before any explicit payload-size cap. Valid exported codes are small and
fixed-size, so oversized input has no product value. Capping input before
`atob`, in-game parsing, and warning token retention prevents a large paste from
freezing the client.

## Current State

Relevant files:

- `src/components/ui/ImportCodeDialog.tsx` - shared import textarea UI used by
  Builder import flows.
- `src/features/builder/useBuilderImportFlow.ts` - shared import submit path
  reused by Builder V2.
- `src/domain/import-export.ts` - standard `t1.` / `mt1.` and wrapped
  `@@...@@` decode entrypoint.
- `src/domain/ingame-codec.ts` - in-game code parser and warning collection.
- `src/domain/import-export.test.ts` - import/export codec tests.
- `src/features/builder-v2/BuilderV2Page.test.tsx` - Builder V2 import coverage.

Current excerpts:

```tsx
// src/components/ui/ImportCodeDialog.tsx:33
<textarea
  aria-label='Import code'
  ...
  value={value}
/>
```

```ts
// src/features/builder/useBuilderImportFlow.ts:259
function submitImportCode(code: string) {
  let decoded
  try {
    decoded = decodeImportCode(code)
```

```ts
// src/domain/import-export.ts:139
function extractImportCodeCandidate(rawValue: string): string {
  const trimmed = rawValue.trim()
  ...
  return trimmed
}

// src/domain/import-export.ts:182
function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  const binary = atob(`${normalized}${padding}`)
```

```ts
// src/domain/import-export.ts:425
function decodeSingleTeamImport(payload: string): DecodedImport {
  const bytes = base64UrlToBytes(payload)
  if (bytes.length !== bytesPerTeam) {
```

```ts
// src/domain/ingame-codec.ts:338
if (cursor < covenantBlock.length) {
  warnings.push({
    section: 'covenant',
    slotIndex: TEAM_SLOT_COUNT - 1,
    token: covenantBlock.slice(cursor),
```

Repo conventions:

- Validation failures throw user-safe `Error` messages from domain decoders.
- UI submit handlers catch decoder errors and show `showToast(...)`.
- Add codec tests in `src/domain/import-export.test.ts`; add UI-flow coverage
  only when a user-visible message or dialog behavior changes.

## Commands You Will Need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Codec tests | `npx vitest run src/domain/import-export.test.ts --run` | all tests pass |
| Builder V2 import smoke | `npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` | all tests pass |
| Typecheck | `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope**:

- `src/components/ui/ImportCodeDialog.tsx`
- `src/domain/import-export.ts`
- `src/domain/ingame-codec.ts`
- `src/domain/import-export.test.ts`
- `src/features/builder-v2/BuilderV2Page.test.tsx` only if needed for the
  user-facing import error path
- `src/features/builder/BuilderPage.import-export.test.tsx` only if the shared
  dialog behavior needs classic Builder coverage

**Out of scope**:

- Changing the exported `t1.` / `mt1.` byte format.
- Changing the `@@...@@` in-game codec semantics beyond rejecting oversized
  input and truncating oversized warning details.
- Persistence migrations, team model changes, or UI redesign.

## Git Workflow

- Branch: `codex/001-cap-import-payloads`.
- Commit message style should match recent history, for example
  `fix: cap builder import payload size`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Define explicit maximum import lengths

In `src/domain/import-export.ts`, add named constants near the import prefixes
or decode helpers:

- One max for single-team standard payload.
- One max for multi-team standard payload. This should be derived from the max
  supported builder team count and `bytesPerTeam` where possible.
- One conservative max for wrapped in-game imports. Keep it comfortably above
  valid `@@...@@` codes but small enough that it cannot freeze the UI.

Add a helper such as `assertImportCodeLengthWithinLimit(trimmed: string)` and
call it in `decodeImportCode` immediately after `extractImportCodeCandidate`
and before any `atob` call or wrapped in-game decode.

**Verify**:
`npx vitest run src/domain/import-export.test.ts --run` should pass existing
tests.

### Step 2: Reject oversized textarea submissions before domain decode

In `src/components/ui/ImportCodeDialog.tsx`, add a `maxLength` prop and disable
submission if the trimmed value exceeds the shared limit. Prefer exporting a
user-facing helper from `src/domain/import-export.ts`, for example
`isImportCodeCandidateTooLong(value)`, rather than duplicating constants in the
component.

If the component needs to show an error itself, keep copy short and consistent
with existing import errors. Otherwise let `decodeImportCode` throw a clear
message and rely on `useBuilderImportFlow.submitImportCode`.

**Verify**:
`npx vitest run src/features/builder-v2/BuilderV2Page.test.tsx --run` should pass.

### Step 3: Truncate oversized warning token retention

In `src/domain/ingame-codec.ts`, update warning creation so any retained
unknown token or trailing token preview is bounded. Do not store arbitrary
trailing input in `warnings`.

Use a small helper, for example `truncateWarningToken(token: string)`, so future
warning sites can share the same cap.

**Verify**:
`npx vitest run src/domain/import-export.test.ts --run` should pass.

### Step 4: Add regression tests

In `src/domain/import-export.test.ts`, add tests for:

- Oversized `t1.` input rejects before large base64 decode.
- Oversized `mt1.` input rejects.
- Oversized wrapped `@@...@@` input rejects.
- In-game warning token previews are bounded if a syntactically valid but
  warning-producing code has trailing covenant content.

If a UI error path changes, add one Builder V2 page test that opens Import,
pastes an oversized code, submits, and expects the user-facing rejection.

**Verify**:
`npx vitest run src/domain/import-export.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run`
should pass.

## Test Plan

- Add domain-level tests in `src/domain/import-export.test.ts` for the length
  boundaries.
- Use existing Builder V2 import tests around
  `src/features/builder-v2/BuilderV2Page.test.tsx:739` as the UI pattern if a
  page test is needed.
- Run typecheck and lint after tests.

## Done Criteria

- [ ] Oversized standard and wrapped imports are rejected before `atob` or
      in-game parsing performs work proportional to the oversized input.
- [ ] Valid current exports still decode.
- [ ] Unknown-token warning details are bounded.
- [ ] `npx vitest run src/domain/import-export.test.ts src/features/builder-v2/BuilderV2Page.test.tsx --run` passes.
- [ ] `npx tsc -p tsconfig.app.json --noEmit` passes.
- [ ] `npm run lint` passes.
- [ ] No files outside the in-scope list are modified, except
      `plans/README.md` status.

## STOP Conditions

Stop and report if:

- The standard export format needs to change to implement the cap.
- Existing valid exported codes exceed the proposed cap.
- The fix requires changing builder persistence or team data models.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance Notes

If future import formats are added, they must define a maximum accepted length
before any decode/parse step. Reviewers should look for duplicated magic numbers
between UI and domain code.
