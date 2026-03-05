import { useRef } from 'react'
import { FaXmark } from 'react-icons/fa6'
import {
  parseRichDescription,
  type RichSegment,
  type ScalingSegment,
} from '../../domain/rich-text'
import type { AwakenerFullStats } from '../../domain/awakeners-full'
import { DEFAULT_REALM_TINT, REALM_TINT_BY_LABEL } from '../../domain/factions'
import { computeStatRange, formatScalingRange } from '../../domain/scaling'
import { renderTextWithBreaks, scaledFontStyle } from './font-scale'
import { usePopoverDismiss, usePopoverPosition } from './usePopoverDismiss'

type SkillPopoverProps = {
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  anchorRect: DOMRect
  onClose: () => void
  onNavigateToCards?: () => void
}

export function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  anchorRect,
  onClose,
  onNavigateToCards,
}: SkillPopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  usePopoverDismiss(ref, onClose)
  usePopoverPosition(ref, anchorRect)

  const segments = parseRichDescription(description, cardNames)

  return (
    <div
      className="fixed z-[950] w-72 border border-slate-600/50 bg-slate-950/[.97] shadow-[0_8px_24px_rgba(2,6,23,0.7)]"
      data-skill-popover=""
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      ref={ref}
      style={{ top: 0, left: -9999 }}
    >
      <div className="flex items-start justify-between px-3 pt-2.5 pb-1.5">
        <div>
          {onNavigateToCards ? (
            <button
              className="ui-title text-amber-100 transition-colors hover:text-amber-200"
              onClick={() => { onClose(); onNavigateToCards() }}
              style={scaledFontStyle(12)}
              title="View in Cards tab"
              type="button"
            >
              {name} ↗
            </button>
          ) : (
            <p
              className="ui-title text-amber-100"
              style={scaledFontStyle(12)}
            >{name}</p>
          )}
          <p
            className="text-slate-500"
            style={scaledFontStyle(10)}
          >{label}</p>
        </div>
        <button
          aria-label="Close skill popover"
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
          {segments.map((seg, i) => (
            <PopoverSegment key={i} segment={seg} stats={stats} />
          ))}
        </p>
      </div>
    </div>
  )
}

function PopoverSegment({ segment, stats }: { segment: RichSegment; stats: AwakenerFullStats | null }) {
  switch (segment.type) {
    case 'text':
      return <>{renderTextWithBreaks(segment.value)}</>
    case 'skill':
      return <span className="text-amber-200/80">{segment.name}</span>
    case 'stat':
      return <span className="text-sky-300/80">{segment.name}</span>
    case 'mechanic':
      return <span className="text-slate-300/80">{segment.name}</span>
    case 'realm':
      return <span style={{ color: REALM_TINT_BY_LABEL[segment.name] ?? DEFAULT_REALM_TINT }}>{segment.name}</span>
    case 'scaling':
      return <PopoverScaling segment={segment} stats={stats} />
  }
}

function PopoverScaling({ segment, stats }: { segment: ScalingSegment; stats: AwakenerFullStats | null }) {
  const { values, suffix, stat } = segment
  const display = formatScalingRange(values, suffix)
  const computed = computeStatRange(values, suffix, stat, stats)
  if (computed) {
    return (
      <span>
        <span className="text-amber-100/80">{computed}</span>
        <span className="text-slate-500"> ({display}{stat ? ` ${stat}` : ''})</span>
      </span>
    )
  }
  return (
    <span className="text-amber-100/80">
      {display}
      {stat ? (
        <>
          {' '}
          <span className="text-sky-300/80">{stat}</span>
        </>
      ) : null}
    </span>
  )
}
