import type {RichSegment} from '@/domain/rich-text'

export function nextRichSegmentKey(keyCounts: Map<string, number>, segment: RichSegment): string {
  const baseKey = richSegmentKeyBase(segment)
  const occurrence = keyCounts.get(baseKey) ?? 0
  keyCounts.set(baseKey, occurrence + 1)
  return `${baseKey}:${String(occurrence)}`
}

export function richSegmentKeyBase(segment: RichSegment): string {
  switch (segment.type) {
    case 'text':
      return `text:${segment.value}`
    case 'skill':
      return `skill:${segment.name}`
    case 'stat':
      return `stat:${segment.name}`
    case 'mechanic':
      return `mechanic:${segment.name}`
    case 'realm':
      return `realm:${segment.name}`
    case 'scaling':
      return `scaling:${segment.stat ?? 'none'}:${segment.suffix}:${segment.values.join(',')}`
    case 'newline':
      return 'newline'
    case 'paragraph':
      return 'paragraph'
    case 'indent':
      return 'indent'
    case 'line':
      return `line:${segment.indented ? 'indented' : 'plain'}:${segment.segments.map(richSegmentKeyBase).join('|')}`
    default:
      return 'unknown'
  }
}
