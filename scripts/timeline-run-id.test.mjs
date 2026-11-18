import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

import {createTimelineRunId, createUnusedTimelineRunId} from './timeline-run-id.mjs'

test('timeline IDs use the game calendar day, not UTC or ingestion order', () => {
  assert.equal(createTimelineRunId('pickman-canvas', '2026/11/02 03:00'), 'pickman-canvas-261102')
  assert.equal(createTimelineRunId('pickman-canvas', '2027/11/02'), 'pickman-canvas-271102')
  assert.equal(createTimelineRunId('pickman-canvas', '2024/02/29'), 'pickman-canvas-240229')
})

test('timeline ID generation rejects bad inputs and same-day collisions', () => {
  assert.throws(() => createTimelineRunId('Kaleido FL', '2026/11/16'), /series key/)
  assert.throws(() => createTimelineRunId('kaleido-fl', '2026/02/29'), /valid game-local date/)
  assert.throws(
    () => createTimelineRunId('kaleido-fl', '2026/11/16 25:00'),
    /valid game-local date/,
  )
  const entries = [{id: 'kaleido-fl-261116'}]
  assert.throws(
    () => createUnusedTimelineRunId('kaleido-fl', '2026/11/16', entries),
    /already in use/,
  )
  assert.equal(
    createUnusedTimelineRunId('kaleido-fl-alt', '2026/11/16', entries),
    'kaleido-fl-alt-261116',
  )
})

test('checked-in timeline runs have unique date-stamped IDs and valid related links', () => {
  const entries = ['events', 'banners'].flatMap((kind) =>
    JSON.parse(readFileSync(new URL(`../src/data/timeline/${kind}.json`, import.meta.url), 'utf8')),
  )
  const ids = new Set(entries.map((entry) => entry.id))
  assert.equal(ids.size, entries.length, 'run IDs must be unique across events and banners')
  for (const {id, related = []} of entries) {
    const match = /^(.+)-(\d{2})(\d{2})(\d{2})$/.exec(id)
    assert.ok(match, `${id} must end in YYMMDD`)
    const [, series, year, month, day] = match
    // The date stamp is immutable after publication, even if startDate is corrected later.
    assert.equal(id, createTimelineRunId(series, `20${year}/${month}/${day}`))
    for (const target of related) assert.ok(ids.has(target), `${id} links to missing ${target}`)
  }
})
