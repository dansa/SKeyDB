import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  parseRichDescription,
  type RichSegment,
  type ScalingSegment,
} from '../../domain/rich-text'
import type { AwakenerFull, AwakenerCard, AwakenerFullStats } from '../../domain/awakeners-full'
import { DEFAULT_REALM_TINT, REALM_TINT_BY_LABEL } from '../../domain/factions'
import { buildScalingHover, computeStatValue, fmtNum } from '../../domain/scaling'
import { resolveTag, type Tag } from '../../domain/tags'
import { renderTextWithBreaks } from './font-scale'
import { SkillPopover } from './SkillPopover'
import { TagPopover } from './TagPopover'

type PopoverData = {
  card: AwakenerCard
  label: string
  rect: DOMRect
}

type TagPopoverData = {
  tag: Tag
  rect: DOMRect
}

type RichDescriptionProps = {
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  skillLevel: number
  onNavigateToCards?: () => void
}

type SegmentRendererProps = {
  segment: RichSegment
  skillLevel: number
  stats: AwakenerFullStats | null
  onSkillClick: (name: string, e: React.MouseEvent) => void
  onMechanicClick: (tag: Tag, e: React.MouseEvent) => void
}

type CardInfo = {
  card: AwakenerCard
  label: string
}

export function RichDescription({
  text,
  cardNames,
  fullData,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards = (fullData && fullData.cards['C1'] && !cardNames.has('Rouse'))
    ? new Set([...cardNames, 'Rouse'])
    : cardNames
  const segments = parseRichDescription(text, rouseAwareCards)
  const [popover, setPopover] = useState<PopoverData | null>(null)
  const [tagPopover, setTagPopover] = useState<TagPopoverData | null>(null)

  const handleSkillClick = useCallback(
    (name: string, e: React.MouseEvent) => {
      if (!fullData) return
      const result = resolveCardInfo(fullData, name)
      if (!result) return
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setTagPopover(null)
      setPopover({ card: result.card, label: result.label, rect })
    },
    [fullData],
  )

  const handleMechanicClick = useCallback(
    (tag: Tag, e: React.MouseEvent) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setPopover(null)
      setTagPopover({ tag, rect })
    },
    [],
  )

  const closePopover = useCallback(() => { setPopover(null); setTagPopover(null) }, [])

  return (
    <>
      <span>
        {segments.map((seg, i) => (
          <SegmentRenderer
            key={i}
            onMechanicClick={handleMechanicClick}
            onSkillClick={handleSkillClick}
            segment={seg}
            skillLevel={skillLevel}
            stats={fullData?.stats ?? null}
          />
        ))}
      </span>
      {popover
        ? createPortal(
            <SkillPopover
              anchorRect={popover.rect}
              cardNames={rouseAwareCards}
              description={popover.card.description}
              label={popover.label}
              name={popover.card.name}
              onClose={closePopover}
              onNavigateToCards={onNavigateToCards}
              stats={fullData?.stats ?? null}
            />,
            document.body,
          )
        : null}
      {tagPopover
        ? createPortal(
            <TagPopover
              anchorRect={tagPopover.rect}
              onClose={closePopover}
              tag={tagPopover.tag}
            />,
            document.body,
          )
        : null}
    </>
  )
}

function SegmentRenderer({ segment, skillLevel, stats, onSkillClick, onMechanicClick }: SegmentRendererProps) {
  switch (segment.type) {
    case 'text':
      return <>{renderTextWithBreaks(segment.value)}</>

    case 'skill':
      return (
        <button
          className="cursor-pointer border-b border-amber-200/40 text-amber-200/90 transition-colors hover:border-amber-200/70 hover:text-amber-100"
          onClick={(e) => onSkillClick(segment.name, e)}
          style={{ fontSize: 'inherit' }}
          type="button"
        >
          {segment.name}
        </button>
      )

    case 'stat':
      return (
        <span className="text-sky-300/90">{segment.name}</span>
      )

    case 'mechanic': {
      const tag = resolveTag(segment.name)
      const desc = tag?.description || null
      if (tag && desc) {
        return (
          <button
            className="cursor-pointer border-b border-dotted border-slate-500/50 text-slate-300/90 transition-colors hover:border-slate-400/70 hover:text-slate-200"
            onClick={(e) => onMechanicClick(tag, e)}
            style={{ fontSize: 'inherit' }}
            type="button"
          >
            {segment.name}
          </button>
        )
      }
      return (
        <span
          className="border-b border-dotted border-slate-500/50 text-slate-300/90"
          title="Details coming soon"
        >
          {segment.name}
        </span>
      )
    }

    case 'realm':
      return <span style={{ color: REALM_TINT_BY_LABEL[segment.name] ?? DEFAULT_REALM_TINT }}>{segment.name}</span>

    case 'scaling':
      return <ScalingRenderer segment={segment} skillLevel={skillLevel} stats={stats} />
  }
}

function ScalingRenderer({ segment, skillLevel, stats }: { segment: ScalingSegment; skillLevel: number; stats: AwakenerFullStats | null }) {
  const idx = Math.max(0, Math.min(skillLevel - 1, segment.values.length - 1))
  const value = segment.values[idx]
  const displayValue = fmtNum(value)
  const computed = computeStatValue(value, segment.suffix, segment.stat, stats)
  const hoverText = buildScalingHover(segment.values, segment.suffix, segment.stat, stats)

  if (computed !== null) {
    return (
      <span className="cursor-help" title={hoverText}>
        <span className="text-amber-100/90">{computed}</span>
        <span className="text-slate-500"> ({displayValue}{segment.suffix}{segment.stat ? ` ${segment.stat}` : ''})</span>
      </span>
    )
  }

  return (
    <span className="cursor-help text-amber-100/90" title={hoverText}>
      {displayValue}
      {segment.suffix}
      {segment.stat ? (
        <>
          {' '}
          <span className="text-sky-300/90">{segment.stat}</span>
        </>
      ) : null}
    </span>
  )
}

function resolveCardInfo(fullData: AwakenerFull, name: string): CardInfo | null {
  if (name === 'Rouse') {
    const c1 = fullData.cards['C1']
    if (c1) return { card: c1, label: `Rouse · Cost ${c1.cost}` }
  }
  for (const [key, card] of Object.entries(fullData.cards)) {
    if (card.name === name) {
      const slotLabel = key === 'C1' ? 'Rouse' : key
      return { card, label: `${slotLabel} · Cost ${card.cost}` }
    }
  }
  if (fullData.exalts.exalt.name === name) {
    return { card: { name, cost: '—', description: fullData.exalts.exalt.description }, label: 'Exalt' }
  }
  if (fullData.exalts.over_exalt.name === name) {
    return { card: { name, cost: '—', description: fullData.exalts.over_exalt.description }, label: 'Over Exalt' }
  }
  for (const [key, talent] of Object.entries(fullData.talents)) {
    if (talent.name === name) {
      return { card: { name, cost: '—', description: talent.description }, label: `Talent · ${key}` }
    }
  }
  for (const [key, enlighten] of Object.entries(fullData.enlightens)) {
    if (enlighten.name === name) {
      return { card: { name, cost: '—', description: enlighten.description }, label: `Enlighten · ${key}` }
    }
  }
  return null
}
