import type {ReactNode} from 'react'

import {FaCaretDown, FaCaretUp} from 'react-icons/fa6'

import {type AwakenerSortKey, type CollectionSortDirection} from '@/domain/collection-sorting'

import {Button} from './Button'
import {TogglePill} from './TogglePill'

interface CollectionSortControlsProps<TSortKey extends string = AwakenerSortKey> {
  sortKey: TSortKey
  sortDirection: CollectionSortDirection
  groupByRealm?: boolean
  onSortKeyChange: (nextKey: TSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByRealmChange?: (nextGroupByRealm: boolean) => void
  sortOptions?: readonly TSortKey[]
  showGroupByRealm?: boolean
  headingText?: string
  sortSelectAriaLabel?: string
  sortDirectionAriaLabel?: string
  groupByRealmAriaLabel?: string
  layout?: 'stacked' | 'compact'
  compactTrailingAction?: ReactNode
  className?: string
  getSortLabel?: (sortKey: TSortKey) => string
}

const defaultSortOptions: readonly AwakenerSortKey[] = [
  'LEVEL',
  'RARITY',
  'ENLIGHTEN',
  'ALPHABETICAL',
]

function getSortLabel(sortKey: string): string {
  if (sortKey === 'LEVEL') {
    return 'Level'
  }
  if (sortKey === 'ENLIGHTEN') {
    return 'Enlighten'
  }
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'ATK') {
    return 'ATK'
  }
  if (sortKey === 'DEF') {
    return 'DEF'
  }
  if (sortKey === 'CON') {
    return 'CON'
  }
  return 'Alphabetical'
}

function resolveSortOptions<TSortKey extends string>(
  sortOptions?: readonly TSortKey[],
): readonly TSortKey[] {
  return sortOptions ?? (defaultSortOptions as unknown as readonly TSortKey[])
}

export function CollectionSortControls<TSortKey extends string = AwakenerSortKey>({
  sortKey,
  sortDirection,
  groupByRealm,
  onSortKeyChange,
  onSortDirectionToggle,
  onGroupByRealmChange,
  sortOptions,
  showGroupByRealm,
  headingText = 'Sort',
  sortSelectAriaLabel = 'Sort by',
  sortDirectionAriaLabel = 'Toggle sort direction',
  groupByRealmAriaLabel = 'Toggle grouping by realm',
  layout = 'stacked',
  compactTrailingAction,
  className,
  getSortLabel: getSortLabelOverride,
}: CollectionSortControlsProps<TSortKey>) {
  const resolvedSortOptions = resolveSortOptions(sortOptions)
  const activeSortKey = resolvedSortOptions.includes(sortKey)
    ? sortKey
    : resolvedSortOptions.length > 0
      ? resolvedSortOptions[0]
      : sortKey
  const resolvedGroupByRealm = groupByRealm ?? false
  const resolvedShowGroupByRealm =
    showGroupByRealm ?? (groupByRealm !== undefined && onGroupByRealmChange !== undefined)
  const isCompact = layout === 'compact'
  const controlClassName =
    'h-8 min-w-0 border border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.9),rgba(8,13,24,0.84))] px-2.5 text-[11px] leading-none text-slate-200 outline-none transition-colors focus:border-amber-300/60'
  const directionButtonClassName = 'h-8 w-[78px] px-2.5 text-[11px] leading-none'

  return (
    <div className={className}>
      <div className={isCompact ? 'space-y-0' : 'space-y-1'}>
        {!isCompact ? (
          <div className='text-[10px] tracking-wide text-slate-400 uppercase'>{headingText}</div>
        ) : null}
        <div className='flex flex-wrap items-center gap-1.5'>
          <select
            aria-label={sortSelectAriaLabel}
            className={`flex-1 rounded-[2px] ${controlClassName}`}
            onChange={(event) => {
              onSortKeyChange(event.target.value as TSortKey)
            }}
            value={activeSortKey}
          >
            {resolvedSortOptions.map((option) => (
              <option key={option} value={option}>
                {getSortLabelOverride ? getSortLabelOverride(option) : getSortLabel(option)}
              </option>
            ))}
          </select>
          <Button
            aria-label={sortDirectionAriaLabel}
            className={directionButtonClassName}
            onClick={onSortDirectionToggle}
            type='button'
            variant='secondary'
          >
            <span className='inline-flex items-center gap-1'>
              {sortDirection === 'DESC' ? (
                <FaCaretDown aria-hidden className='text-[11px]' />
              ) : (
                <FaCaretUp aria-hidden className='text-[11px]' />
              )}
              <span>{sortDirection === 'DESC' ? 'High' : 'Low'}</span>
            </span>
          </Button>
          {isCompact ? compactTrailingAction : null}
        </div>
        {resolvedShowGroupByRealm && onGroupByRealmChange ? (
          <div className='flex items-center justify-between gap-2'>
            <span className='text-[10px] tracking-wide text-slate-400 uppercase'>
              Group By Realm
            </span>
            <TogglePill
              ariaLabel={groupByRealmAriaLabel}
              checked={resolvedGroupByRealm}
              className='ownership-pill-builder'
              offLabel='Off'
              onChange={onGroupByRealmChange}
              onLabel='On'
              variant='flat'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
