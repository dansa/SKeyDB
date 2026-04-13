import {FaXmark} from 'react-icons/fa6'

import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {
  DATABASE_ENTRY_TITLE_CLASS,
  DATABASE_POPOVER_DIVIDER_CLASS,
  DATABASE_POPOVER_HEADER_CLASS,
  DATABASE_POPOVER_SHELL_CLASS,
  DATABASE_POPOVER_SURFACE_STYLE,
} from '../../utils/text-styles'
import {nextRichSegmentKey} from '../RichText/rich-segment-keys'
import {RichSegmentRenderer} from '../RichText/RichSegmentRenderer'

type SkillPopoverProps = Readonly<{
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  onClose: () => void
  onSkillTokenClick: (name: string, e: React.MouseEvent) => void
  onMechanicTokenClick: (tag: Tag, e: React.MouseEvent) => void
  onScalingTokenClick: (
    values: number[],
    suffix: string,
    stat: string | null,
    e: React.MouseEvent,
  ) => void
  onNavigateToCards?: () => void
  skillLevel: number
}>

export function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
  onScalingTokenClick,
  onNavigateToCards,
  skillLevel,
}: SkillPopoverProps) {
  const segments = parseRichDescription(description, cardNames)
  const isCostLabel = label.startsWith('Cost ')
  const costValue = isCostLabel ? label.slice('Cost '.length) : null
  const displayLabel = isCostLabel ? null : formatBubbleLabel(label)
  const separatorNode = isCostLabel ? null : <span className='text-slate-600'>&#9671;?</span>
  const segmentKeyCounts = new Map<string, number>()

  const labelNode =
    isCostLabel && costValue ? (
      <span
        className='inline-flex items-center gap-1 text-amber-100/88'
        style={{fontSize: '0.9em'}}
      >
        <img
          alt=''
          aria-hidden='true'
          className='h-[1.1em] w-[1.1em] object-contain opacity-90'
          draggable={false}
          src={costIcon}
        />
        <span>{costValue}</span>
      </span>
    ) : (
      <span className='font-normal tracking-[0.02em] text-slate-500' style={{fontSize: '0.72em'}}>
        {displayLabel}
      </span>
    )

  const titleNode = onNavigateToCards ? (
    <button
      className={`${DATABASE_ENTRY_TITLE_CLASS} flex items-center gap-2 transition-colors hover:text-amber-100`}
      onClick={() => {
        onClose()
        onNavigateToCards()
      }}
      style={{fontSize: '1.3em'}}
      title='View in Skills tab'
      type='button'
    >
      {labelNode}
      {separatorNode}
      <span>{name} &rarr;</span>
    </button>
  ) : (
    <p
      className={`${DATABASE_ENTRY_TITLE_CLASS} flex items-center gap-2`}
      style={{fontSize: '1.3em'}}
    >
      {labelNode}
      {separatorNode}
      <span>{name}</span>
    </p>
  )

  return (
    <div
      className={`${DATABASE_POPOVER_SHELL_CLASS} p-3`}
      style={{
        fontSize: 'calc(var(--desc-font-scale, 1) * 10px)',
        ...DATABASE_POPOVER_SURFACE_STYLE,
      }}
    >
      <div className={DATABASE_POPOVER_HEADER_CLASS}>
        <div>{titleNode}</div>
        <button
          aria-label='Close skill popover'
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
              onMechanicClick={(tag, event) => {
                onMechanicTokenClick(tag, event)
              }}
              onSkillClick={(nextName, event) => {
                onSkillTokenClick(nextName, event)
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

function formatBubbleLabel(label: string): string {
  return label
    .replaceAll('-', ' ')
    .toLowerCase()
    .replaceAll(/\b([a-z])/g, (match) => match.toUpperCase())
}
