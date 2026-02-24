import { FaCaretDown, FaCaretUp } from 'react-icons/fa6'
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
  className?: string
}

const defaultSortOptions: readonly AwakenerSortKey[] = ['LEVEL', 'ENLIGHTEN', 'ALPHABETICAL']

function getSortLabel(sortKey: AwakenerSortKey): string {
  if (sortKey === 'LEVEL') {
    return 'Level'
  }
  if (sortKey === 'ENLIGHTEN') {
    return 'Enlighten'
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
  className,
}: CollectionSortControlsProps) {
  const activeSortKey = sortOptions.includes(sortKey) ? sortKey : sortOptions[0] ?? 'LEVEL'

  return (
    <div className={className}>
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-slate-400">{headingText}</div>
        <div className="flex items-center gap-1">
          <select
            aria-label={sortSelectAriaLabel}
            className="min-w-0 flex-1 border border-slate-500/55 bg-slate-950/90 px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-amber-300/65"
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
            className="px-2 py-1 text-[11px]"
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
