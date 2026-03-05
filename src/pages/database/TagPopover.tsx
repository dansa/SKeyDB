import { useRef } from 'react'
import { FaXmark } from 'react-icons/fa6'
import type { Tag } from '../../domain/tags'
import { renderTextWithBreaks, scaledFontStyle } from './font-scale'
import { usePopoverDismiss, usePopoverPosition } from './usePopoverDismiss'

type TagPopoverProps = {
  tag: Tag
  anchorRect: DOMRect
  onClose: () => void
}

export function TagPopover({ tag, anchorRect, onClose }: TagPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  usePopoverDismiss(ref, onClose)
  usePopoverPosition(ref, anchorRect)

  return (
    <div
      className="fixed z-[950] w-64 border border-slate-600/50 bg-slate-950/[.97] shadow-[0_8px_24px_rgba(2,6,23,0.7)]"
      data-skill-popover=""
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      ref={ref}
      style={{ top: 0, left: -9999 }}
    >
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1.5">
        <p
          className="ui-title text-amber-100"
          style={scaledFontStyle(12)}
        >{tag.label}</p>
        <button
          aria-label="Close tag popover"
          className="ml-2 shrink-0 text-slate-500 transition-colors hover:text-amber-100"
          onClick={onClose}
          type="button"
        >
          <FaXmark className="h-3 w-3" />
        </button>
      </div>
      <div className="px-3 pb-3">
        <p
          className="leading-relaxed text-slate-400"
          style={scaledFontStyle(11)}
        >
          {renderTextWithBreaks(tag.description)}
        </p>
      </div>
    </div>
  )
}
