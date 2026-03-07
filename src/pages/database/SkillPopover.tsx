import {FaXmark} from 'react-icons/fa6'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {scaledFontStyle} from './font-scale'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

interface SkillPopoverProps {
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  onClose: () => void
  onSkillTokenClick: (name: string) => void
  onMechanicTokenClick: (tag: Tag) => void
  onNavigateToCards?: () => void
}

export function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
  onNavigateToCards,
}: SkillPopoverProps) {
  const segments = parseRichDescription(description, cardNames)

  return (
    <div
      className='w-full border border-slate-600/50 bg-slate-950/[.97] shadow-[0_8px_24px_rgba(2,6,23,0.7)]'
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
    >
      <div className='flex items-start justify-between px-3 pt-2.5 pb-1.5'>
        <div>
          {onNavigateToCards ? (
            <button
              className={`${DATABASE_ENTRY_TITLE_CLASS} transition-colors hover:text-amber-100`}
              onClick={() => {
                onClose()
                onNavigateToCards()
              }}
              style={scaledFontStyle(12)}
              title='View in Cards tab'
              type='button'
            >
              {name} ↗
            </button>
          ) : (
            <p className={DATABASE_ENTRY_TITLE_CLASS} style={scaledFontStyle(12)}>
              {name}
            </p>
          )}
          <p className='text-slate-500' style={scaledFontStyle(10)}>
            {label}
          </p>
        </div>
        <button
          aria-label='Close skill popover'
          className='ml-2 shrink-0 text-slate-500 transition-colors hover:text-amber-100'
          onClick={() => {
            onClose()
          }}
          type='button'
        >
          <FaXmark className='h-3 w-3' />
        </button>
      </div>
      <div className='px-3 pb-3'>
        <p className='leading-relaxed text-slate-400' style={scaledFontStyle(11)}>
          {segments.map((seg, i) => (
            <RichSegmentRenderer
              key={i}
              onMechanicClick={(tag) => {
                onMechanicTokenClick(tag)
              }}
              onSkillClick={(name) => {
                onSkillTokenClick(name)
              }}
              segment={seg}
              skillLevel={1}
              stats={stats}
              variant='popover'
            />
          ))}
        </p>
      </div>
    </div>
  )
}
