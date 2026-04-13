import {describe, expect, it} from 'vitest'

import {
  closeTrailFromIndex,
  closeTrailTop,
  decideTrailDirection,
  isSameTrailRoot,
  isTrailMobileLayout,
  openTrailRoot,
  pushTrailEntry,
  type TrailEntry,
} from './popover-trail'

function skillEntry(key: string): TrailEntry {
  return {
    kind: 'skill',
    key,
    name: key,
    label: 'Skill',
    description: 'desc',
  }
}

describe('popover trail stack helpers', () => {
  it('pushes new entries to the trail', () => {
    const next = pushTrailEntry([skillEntry('s1')], skillEntry('s2'))
    expect(next.map((e) => e.key)).toEqual(['s1', 's2'])
  })

  it('deduplicates by key and trims descendants when revisiting an existing entry', () => {
    const stack = [skillEntry('s1'), skillEntry('s2'), skillEntry('s3')]
    const next = pushTrailEntry(stack, skillEntry('s2'))
    expect(next.map((e) => e.key)).toEqual(['s1', 's2'])
  })

  it('closes only the top entry', () => {
    const next = closeTrailTop([skillEntry('s1'), skillEntry('s2')])
    expect(next.map((e) => e.key)).toEqual(['s1'])
  })

  it('closes a selected entry and everything above it', () => {
    const next = closeTrailFromIndex([skillEntry('s1'), skillEntry('s2'), skillEntry('s3')], 1)
    expect(next.map((e) => e.key)).toEqual(['s1'])
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
    const direction = decideTrailDirection({top: 120, bottom: 150} as DOMRect, 900)
    expect(direction).toBe('down')
  })

  it('switches to upward growth when below space is constrained', () => {
    const direction = decideTrailDirection({top: 760, bottom: 790} as DOMRect, 900)
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
