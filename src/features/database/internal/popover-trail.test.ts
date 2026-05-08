import {describe, expect, it} from 'vitest'

import type {AwakenerSkillRecord} from '@/domain/awakener-source-schema'

import {
  closeTrailFromIndex,
  decideTrailDirection,
  insertTrailEntryAfterIndex,
  isSameTrailRoot,
  isTrailMobileLayout,
  openTrailRoot,
  type TrailEntry,
} from './popover-trail'

const TEST_RECORD: AwakenerSkillRecord = {
  id: 'skill.test.entry',
  ownerAwakenerId: 999,
  kind: 'command',
  displayName: 'Test Entry',
  descriptionTemplate: 'desc',
  descriptionArgs: {},
  cardKeywords: [],
  variants: [],
}

function skillEntry(key: string): TrailEntry {
  return {
    key,
    referenceId: key,
    name: key,
    label: 'Skill',
    description: 'desc',
    record: TEST_RECORD,
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influenceBadges: [],
    selectedEnlightenSlot: null,
  }
}

describe('popover trail stack helpers', () => {
  it('inserts a new nested entry directly after the source entry', () => {
    const next = insertTrailEntryAfterIndex(
      [skillEntry('s1'), skillEntry('s2'), skillEntry('s3')],
      1,
      skillEntry('retain'),
    )
    expect(next.map((e) => e.key)).toEqual(['s1', 's2', 'retain', 's3'])
  })

  it('treats reinserting an existing nested entry as a no-op', () => {
    const stack = [skillEntry('s1'), skillEntry('s2'), skillEntry('s3')]
    const next = insertTrailEntryAfterIndex(stack, 1, skillEntry('s3'))
    expect(next.map((e) => e.key)).toEqual(['s1', 's2', 's3'])
  })

  it('closes only the selected entry and keeps the rest of the trail', () => {
    const next = closeTrailFromIndex([skillEntry('s1'), skillEntry('s2'), skillEntry('s3')], 1)
    expect(next.map((e) => e.key)).toEqual(['s1', 's3'])
  })

  it('allows closing the root entry while keeping later entries open', () => {
    const next = closeTrailFromIndex([skillEntry('s1'), skillEntry('s2'), skillEntry('s3')], 0)
    expect(next.map((e) => e.key)).toEqual(['s2', 's3'])
  })

  it('detects when opening the same root source key', () => {
    expect(isSameTrailRoot([skillEntry('s1'), skillEntry('s2')], 's1')).toBe(true)
    expect(isSameTrailRoot([skillEntry('s1'), skillEntry('s2')], 's2')).toBe(false)
  })

  it('does not replace the stack when opening the current root again', () => {
    const stack = [skillEntry('s1'), skillEntry('s2')]
    const next = openTrailRoot(stack, skillEntry('s1'))
    expect(next).toEqual(stack)
  })

  it('replaces the stack when opening a different root', () => {
    const next = openTrailRoot([skillEntry('s1'), skillEntry('s2')], skillEntry('s4'))
    expect(next.map((e) => e.key)).toEqual(['s4'])
  })
})

describe('popover trail direction', () => {
  it('prefers downward growth when there is enough space below', () => {
    const direction = decideTrailDirection({top: 120, bottom: 150}, 900)
    expect(direction).toBe('down')
  })

  it('switches to upward growth when below space is constrained', () => {
    const direction = decideTrailDirection({top: 760, bottom: 790}, 900)
    expect(direction).toBe('up')
  })
})

describe('popover trail layout mode', () => {
  it('uses mobile layout at and below md-1 breakpoint', () => {
    expect(isTrailMobileLayout(767)).toBe(true)
    expect(isTrailMobileLayout(420)).toBe(true)
  })

  it('uses desktop layout above md-1 breakpoint', () => {
    expect(isTrailMobileLayout(768)).toBe(false)
  })
})
