import {FaXmark} from 'react-icons/fa6'

import {parseRichDescription} from '@/domain/rich-text'
import {type Tag} from '@/domain/tags'

import {scaledFontStyle} from './font-scale'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {DATABASE_ENTRY_TITLE_CLASS} from './text-styles'

interface TagPopoverProps {
  tag: Tag
  cardNames: Set<string>
  onClose: () => void
  onSkillTokenClick: (name: string) => void
  onMechanicTokenClick: (tag: Tag) => void
}

export function TagPopover({
  tag,
  cardNames,
  onClose,
  onSkillTokenClick,
  onMechanicTokenClick,
}: TagPopoverProps) {
  const segments = parseRichDescription(tag.description, cardNames)

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
        <p className={DATABASE_ENTRY_TITLE_CLASS} style={scaledFontStyle(12)}>
          {tag.label}
        </p>
        <button
          aria-label='Close tag popover'
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
              stats={null}
              variant='popover'
            />
          ))}
        </p>
      </div>
    </div>
  )
}
