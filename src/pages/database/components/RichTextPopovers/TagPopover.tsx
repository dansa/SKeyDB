import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {getTagColor, getTagIcon, type Tag} from '@/domain/tags'

import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
  DATABASE_POPOVER_SHELL_CLASS,
  DATABASE_POPOVER_SURFACE_STYLE,
} from '../../utils/text-styles'
import {nextRichSegmentKey} from '../RichText/rich-segment-keys'
import {RichSegmentRenderer} from '../RichText/RichSegmentRenderer'

type TagPopoverProps = Readonly<{
  tag: Tag
  cardNames: Set<string>
  onClose: () => void
  onSkillTokenClick: (name: string, e: React.MouseEvent) => void
  onMechanicTokenClick: (tag: Tag, e: React.MouseEvent) => void
  onScalingTokenClick: (
    values: number[],
    suffix: string,
    stat: string | null,
    e: React.MouseEvent,
  ) => void
  skillLevel: number
  stats: AwakenerFullStats | null
}>

export function TagPopover({
  tag,
  cardNames,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
  onScalingTokenClick,
  skillLevel,
  stats,
}: TagPopoverProps) {
  const segments = parseRichDescription(tag.description, cardNames)
  const color = getTagColor(tag)
  const segmentKeyCounts = new Map<string, number>()

  return (
    <div
      className={`${DATABASE_POPOVER_SHELL_CLASS} p-3`}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 10px)',
        ...DATABASE_POPOVER_SURFACE_STYLE,
      }}
    >
      <div className={DATABASE_POPOVER_HEADER_CLASS}>
        <div className='flex items-center gap-1'>
          {tag.iconId && getTagIcon(tag.iconId) ? (
            <img alt='' className='h-[1.15em] w-auto shrink-0' src={getTagIcon(tag.iconId)} />
          ) : null}
          <p
            className={`${DATABASE_ENTRY_TITLE_CLASS} text-[1.3em] font-semibold tracking-wide`}
            style={{color: color ?? undefined}}
          >
            {tag.label}
          </p>
        </div>
        <button
          className='-mt-0.5 -mr-1 text-slate-400 transition-colors hover:text-white'
          onClick={onClose}
          type='button'
        >
          <FaXmark size={14} />
        </button>
      </div>
      <div className={DATABASE_POPOVER_DIVIDER_CLASS} />
      <div>
        <div className='pl-1.5 leading-relaxed text-slate-400' style={{fontSize: '1.1em'}}>
          {segments.map((segment) => (
            <RichSegmentRenderer
              key={nextRichSegmentKey(segmentKeyCounts, segment)}
              onMechanicClick={(nextTag, event) => {
                onMechanicTokenClick(nextTag, event)
              }}
              onSkillClick={(name, event) => {
                onSkillTokenClick(name, event)
              }}
              onScalingClick={(values, suffix, stat, event) => {
                onScalingTokenClick(values, suffix, stat, event)
              }}
              segment={segment}
              skillLevel={skillLevel}
              stats={stats}
              variant='popover'
            />
          ))}
        </div>
      </div>
    </div>
  )
}
