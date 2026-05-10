import {memo} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {RichSegment} from '@/domain/rich-text'

import {type TokenNavigationRequest} from '../RichTextPopovers/core/popover-navigation'
import {nextRichSegmentKey} from './rich-segment-keys'
import {SEGMENT_RENDERERS} from './segment-registry'

type RichSegmentRendererProps = Readonly<{
  segment: RichSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onTokenNavigate?: (request: TokenNavigationRequest) => void
}>

const INDENT_MARKER = '\u2022'

export const RichSegmentRenderer = memo(function RichSegmentRenderer(
  props: RichSegmentRendererProps,
) {
  const {segment} = props
  const Renderer = SEGMENT_RENDERERS[segment.type]

  if (Renderer) {
    return <Renderer {...props} />
  }

  switch (segment.type) {
    case 'text':
      return <>{segment.value}</>
    case 'newline':
      return <br />
    case 'paragraph':
      return <span aria-hidden='true' className='block h-1' />
    case 'line':
      return <RichLineView {...props} segment={segment} />
    case 'indent':
      return <RichIndentMarker />
    default:
      return null
  }
})

const RichLineView = memo(function RichLineView(
  props: RichSegmentRendererProps & {segment: Extract<RichSegment, {type: 'line'}>},
) {
  const {segment} = props
  const lineClassName = segment.indented ? 'relative pl-5 leading-normal' : 'leading-normal'
  const keyCounts = new Map<string, number>()

  return (
    <div className={lineClassName}>
      {segment.indented && (
        <span className='absolute top-[0.20em] left-1.5 text-[0.8em] text-slate-500/60 select-none'>
          {INDENT_MARKER}
        </span>
      )}
      {segment.segments.map((childSegment) => (
        <RichSegmentRenderer
          key={nextRichSegmentKey(keyCounts, childSegment)}
          {...props}
          segment={childSegment}
        />
      ))}
    </div>
  )
})

function RichIndentMarker() {
  return (
    <span className='relative top-[-0.1em] mr-1.5 ml-1 inline text-[0.8em] text-slate-500/60 select-none'>
      {INDENT_MARKER}
    </span>
  )
}
