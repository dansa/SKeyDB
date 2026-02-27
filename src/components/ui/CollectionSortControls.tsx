import { FaCaretDown, FaCaretUp } from 'react-icons/fa6'
import type { ReactNode } from 'react'
import { type AwakenerSortKey, type CollectionSortDirection } from '../../domain/collection-sorting'
import { Button } from './Button'
import { TogglePill } from './TogglePill'

type CollectionSortControlsProps = {
  sortKey: AwakenerSortKey
  sortDirection: CollectionSortDirection
  groupByFaction: boolean
  onSortKeyChange: (nextKey: AwakenerSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByFactionChange: (nextGroupByFaction: boolean) => void
  sortOptions?: readonly AwakenerSortKey[]
  showGroupByFaction?: boolean
  headingText?: string
  sortSelectAriaLabel?: string
  sortDirectionAriaLabel?: string
  groupByFactionAriaLabel?: string
  layout?: 'stacked' | 'compact'
  compactTrailingAction?: ReactNode
  className?: string
}

const defaultSortOptions: readonly AwakenerSortKey[] = ['LEVEL', 'RARITY', 'ENLIGHTEN', 'ALPHABETICAL']

function getSortLabel(sortKey: AwakenerSortKey): string {
  if (sortKey === 'LEVEL') {
    return 'Level'
  }
  if (sortKey === 'ENLIGHTEN') {
    return 'Enlighten'
  }
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  return 'Alphabetical'
}

export function CollectionSortControls({
  sortKey,
  sortDirection,
  groupByFaction,
  onSortKeyChange,
  onSortDirectionToggle,
  onGroupByFactionChange,
  sortOptions = defaultSortOptions,
  showGroupByFaction = true,
  headingText = 'Sort',
  sortSelectAriaLabel = 'Sort by',
  sortDirectionAriaLabel = 'Toggle sort direction',
  groupByFactionAriaLabel = 'Toggle grouping by faction',
  layout = 'stacked',
  compactTrailingAction,
  className,
}: CollectionSortControlsProps) {
  const activeSortKey = sortOptions.includes(sortKey) ? sortKey : sortOptions[0] ?? 'LEVEL'
  const isCompact = layout === 'compact'
  const controlClassName =
    'h-6 min-w-0 border border-slate-500/55 bg-slate-950/90 px-2 text-[10px] leading-none text-slate-200 outline-none focus:border-amber-300/65'
  const directionButtonClassName = 'h-6 w-[72px] px-2 text-[10px] leading-none'

  return (
    <div className={className}>
      <div className={isCompact ? 'space-y-0' : 'space-y-1'}>
        {!isCompact ? <div className="text-[10px] uppercase tracking-wide text-slate-400">{headingText}</div> : null}
        <div className="flex items-center gap-1">
          <select
            aria-label={sortSelectAriaLabel}
            className={`flex-1 rounded-none ${controlClassName}`}
            onChange={(event) => onSortKeyChange(event.target.value as AwakenerSortKey)}
            value={activeSortKey}
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {getSortLabel(option)}
              </option>
            ))}
          </select>
          <Button
            aria-label={sortDirectionAriaLabel}
            className={directionButtonClassName}
            onClick={onSortDirectionToggle}
            type="button"
            variant="secondary"
          >
            <span className="inline-flex items-center gap-1">
              {sortDirection === 'DESC' ? (
                <FaCaretDown aria-hidden className="text-[11px]" />
              ) : (
                <FaCaretUp aria-hidden className="text-[11px]" />
              )}
              <span>{sortDirection === 'DESC' ? 'High' : 'Low'}</span>
            </span>
          </Button>
          {isCompact ? compactTrailingAction : null}
        </div>
        {showGroupByFaction ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">Group By Faction</span>
            <TogglePill
              ariaLabel={groupByFactionAriaLabel}
              checked={groupByFaction}
              className="ownership-pill-builder"
              offLabel="Off"
              onChange={onGroupByFactionChange}
              onLabel="On"
              variant="flat"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
