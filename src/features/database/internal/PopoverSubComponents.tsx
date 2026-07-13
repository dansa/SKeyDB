import {type MouseEvent} from 'react'

import type {DatabaseReferenceInfo} from '@/domain/database-reference-layer'

import type {
  DatabaseReferenceAttributeRow,
  KeyedDatabaseReferenceEntry,
} from './database-reference-entry'
import {
  buildRelatedReferenceEntry,
  getRelatedReferencePreview,
} from './DatabaseReferencePopoverHelpers'
import {scaledFontStyle} from './font-scale'

function getTextPartsWithKeys(text: string): {key: string; text: string}[] {
  const occurrencesByText = new Map<string, number>()
  return text.split('\n').map((part) => {
    const occurrence = occurrencesByText.get(part) ?? 0
    occurrencesByText.set(part, occurrence + 1)
    return {key: `${part}:${String(occurrence)}`, text: part}
  })
}

export function TextWithBreaksFallback({text}: {text: string}) {
  const [firstPart, ...remainingParts] = getTextPartsWithKeys(text)

  return (
    <span>
      <span key={firstPart.key}>{firstPart.text}</span>
      {remainingParts.flatMap((part) => [
        <br key={`br:${part.key}`} />,
        <span key={part.key}>{part.text}</span>,
      ])}
    </span>
  )
}

export function PopoverAttributesTable({
  entryKey,
  rows,
}: {
  entryKey?: string
  rows: DatabaseReferenceAttributeRow[]
}) {
  const isSecondaryStats = entryKey === 'database:secondary-stats'
  return (
    <div
      className={
        isSecondaryStats
          ? 'mb-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-b border-slate-700/35 pb-2.5 text-[11px] leading-relaxed text-slate-400/86'
          : 'mb-3 space-y-0.5 border-b border-slate-700/35 pb-2.5 text-[11px] leading-relaxed text-slate-400/86'
      }
      data-awakener-secondary-stats={isSecondaryStats ? '' : undefined}
      style={scaledFontStyle(12)}
    >
      {rows.map((row) => (
        <div className='flex min-w-0 items-center gap-x-1.5' key={`${row.label}:${row.value}`}>
          {row.iconSrc ? (
            <img
              alt=''
              aria-hidden
              className='size-4 shrink-0 object-contain opacity-90'
              draggable={false}
              src={row.iconSrc}
            />
          ) : null}
          <span className='text-slate-500/95'>{row.label}</span>
          <span className='text-amber-100/72'>{row.value}</span>
        </div>
      ))}
    </div>
  )
}

function PopoverLinkButton({
  onClick,
  title,
  subtitle,
}: {
  onClick: (e: MouseEvent) => void
  title: string
  subtitle: string
}) {
  return (
    <button
      className='block w-full border border-white/4 bg-white/2 px-2.5 py-2 text-left shadow-sm transition-colors hover:border-amber-200/40 hover:bg-white/4'
      onClick={onClick}
      type='button'
    >
      <span className='block text-[11px] text-slate-200' style={scaledFontStyle(11)}>
        {title}
      </span>
      <span
        className='mt-0.5 block truncate text-[10px] text-slate-500'
        style={scaledFontStyle(10)}
      >
        {subtitle}
      </span>
    </button>
  )
}

export function PopoverDetailLinks({
  links,
  onInfoEntryClick,
}: {
  links: {label: string; entry: KeyedDatabaseReferenceEntry}[]
  onInfoEntryClick: (entry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => void
}) {
  return (
    <div className='mt-3 border-t border-white/5 pt-2.5'>
      <p
        className='mb-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase'
        style={scaledFontStyle(10)}
      >
        More Details
      </p>
      <div className='space-y-1.5'>
        {links.map((detailLink) => (
          <PopoverLinkButton
            key={detailLink.entry.key}
            onClick={(e) => {
              onInfoEntryClick(detailLink.entry, e)
            }}
            subtitle={detailLink.entry.label}
            title={detailLink.label}
          />
        ))}
      </div>
    </div>
  )
}

export function PopoverRelatedSkills({
  relatedReferences,
  onInfoEntryClick,
  onSkillTokenClick,
}: {
  relatedReferences: DatabaseReferenceInfo[]
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => void
  onSkillTokenClick: (name: string, event?: MouseEvent) => void
}) {
  return (
    <div className='mt-3 border-t border-white/5 pt-2.5'>
      <p
        className='mb-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase'
        style={scaledFontStyle(10)}
      >
        Related Skills
      </p>
      <div className='space-y-1.5'>
        {relatedReferences.map((entry) => (
          <PopoverLinkButton
            key={entry.id}
            onClick={(e) => {
              if (onInfoEntryClick) {
                onInfoEntryClick(buildRelatedReferenceEntry(entry), e)
                return
              }
              onSkillTokenClick(entry.name, e)
            }}
            subtitle={getRelatedReferencePreview(entry)}
            title={entry.name}
          />
        ))}
      </div>
    </div>
  )
}
