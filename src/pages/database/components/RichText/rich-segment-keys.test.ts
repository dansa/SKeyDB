import {describe, expect, it} from 'vitest'

import type {RichSegment} from '@/domain/rich-text'

import {nextRichSegmentKey, richSegmentKeyBase} from './rich-segment-keys'

describe('rich-segment-keys', () => {
  it('builds stable keys for repeated segments', () => {
    const keyCounts = new Map<string, number>()
    const segment: RichSegment = {type: 'text', value: 'alpha'}

    expect(nextRichSegmentKey(keyCounts, segment)).toBe('text:alpha:0')
    expect(nextRichSegmentKey(keyCounts, segment)).toBe('text:alpha:1')
  })

  it('includes nested line structure in the base key', () => {
    const segment: RichSegment = {
      type: 'line',
      indented: true,
      segments: [
        {type: 'skill', name: 'Strike'},
        {type: 'text', value: ' deals damage'},
      ],
    }

    expect(richSegmentKeyBase(segment)).toBe('line:indented:skill:Strike|text: deals damage')
  })
})
