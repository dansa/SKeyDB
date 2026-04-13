import type {AwakenerFullStats} from '@/domain/awakeners-full'
import type {RichSegment} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {nextRichSegmentKey} from './rich-segment-keys'
import {
  RichMechanicSegmentView,
  RichRealmSegmentView,
  RichScalingSegmentView,
  RichSkillSegmentView,
  RichStatSegmentView,
} from './RichSegmentViews'

type RichSegmentRendererProps = Readonly<{
  segment: RichSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  variant: 'inline' | 'popover'
  onSkillClick?: (name: string, event: React.MouseEvent) => void
  onMechanicClick?: (tag: Tag, event: React.MouseEvent) => void
  onScalingClick?: (
    values: number[],
    suffix: string,
    stat: string | null,
    event: React.MouseEvent,
  ) => void
}>

const INDENT_MARKER = '\u2022'

export function RichSegmentRenderer(props: RichSegmentRendererProps) {
  const {segment} = props

  switch (segment.type) {
    case 'text':
      return <>{segment.value}</>
    case 'skill':
      return <RichSkillSegmentView onSkillClick={props.onSkillClick} segment={segment} />
    case 'stat':
      return <RichStatSegmentView segment={segment} />
    case 'mechanic':
      return <RichMechanicSegmentView onMechanicClick={props.onMechanicClick} segment={segment} />
    case 'realm':
      return <RichRealmSegmentView realmName={segment.name} />
    case 'scaling':
      return (
        <RichScalingSegmentView
          onScalingClick={props.onScalingClick}
          segment={segment}
          skillLevel={props.skillLevel}
          stats={props.stats}
          variant={props.variant}
        />
      )
    case 'newline':
      return <br />
    case 'paragraph':
      return <span className='block h-1' aria-hidden='true' />
    case 'line': {
      const lineClassName = segment.indented ? 'relative pl-5 leading-normal' : 'leading-normal'
      const keyCounts = new Map<string, number>()
      return (
        <div className={lineClassName}>
          {segment.indented ? (
            <span className='absolute top-[0.20em] left-1.5 text-[0.8em] text-slate-500/60 select-none'>
              {INDENT_MARKER}
            </span>
          ) : null}
          {segment.segments.map((childSegment) => (
            <RichSegmentRenderer
              key={nextRichSegmentKey(keyCounts, childSegment)}
              {...props}
              segment={childSegment}
            />
          ))}
        </div>
      )
    }
    case 'indent':
      return (
        <span className='relative top-[-0.1em] mr-1.5 ml-1 inline text-[0.8em] text-slate-500/60 select-none'>
          {INDENT_MARKER}
        </span>
      )
    default:
      return null
  }
}
