import {FaCaretDown, FaCaretUp} from 'react-icons/fa6'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'

const DATABASE_CONTROL_CLASS_NAME =
  'h-10 min-w-0 rounded-[2px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.9),rgba(8,13,24,0.84))] px-2.5 text-[11px] leading-none text-slate-200 transition-colors hover:border-slate-500/70 focus:border-amber-300/60 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none sm:h-8 [color-scheme:dark]'

interface EntityViewControlsProps<TSortKey extends string> {
  sortKey: TSortKey
  sortDirection: CollectionSortDirection
  sortOptions: readonly TSortKey[]
  sortSelectAriaLabel: string
  sortDirectionAriaLabel: string
  getSortLabel: (key: TSortKey) => string
  getSortDirectionLabel: (key: TSortKey, direction: CollectionSortDirection) => string
  onSortKeyChange: (key: TSortKey) => void
  onSortDirectionToggle: () => void
  groupByRealm?: boolean
  onGroupByRealmChange?: (next: boolean) => void
}

export function EntityViewControls<TSortKey extends string>({
  getSortDirectionLabel,
  getSortLabel,
  groupByRealm,
  onGroupByRealmChange,
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortDirectionAriaLabel,
  sortKey,
  sortOptions,
  sortSelectAriaLabel,
}: EntityViewControlsProps<TSortKey>) {
  const directionLabel = getSortDirectionLabel(sortKey, sortDirection)

  return (
    <div
      aria-label='Database view controls'
      className='flex flex-wrap items-center gap-1.5'
      role='group'
    >
      <span className='text-[10px] tracking-[0.16em] text-slate-500 uppercase'>Sort</span>
      <select
        aria-label={sortSelectAriaLabel}
        className={`database-sort-select flex-1 ${DATABASE_CONTROL_CLASS_NAME}`}
        onChange={(event) => {
          onSortKeyChange(event.target.value as TSortKey)
        }}
        value={sortKey}
      >
        {sortOptions.map((option) => (
          <option className='database-sort-select__option' key={option} value={option}>
            {getSortLabel(option)}
          </option>
        ))}
      </select>
      <button
        aria-label={sortDirectionAriaLabel}
        className={`inline-flex items-center justify-center gap-1 ${DATABASE_CONTROL_CLASS_NAME}`}
        onClick={onSortDirectionToggle}
        type='button'
      >
        {sortDirection === 'DESC' ? (
          <FaCaretDown aria-hidden className='text-[11px]' />
        ) : (
          <FaCaretUp aria-hidden className='text-[11px]' />
        )}
        <span>{directionLabel}</span>
      </button>
      {groupByRealm !== undefined && onGroupByRealmChange ? (
        <FilterChipButton
          active={groupByRealm}
          ariaLabel='Toggle grouping by realm'
          onClick={() => {
            onGroupByRealmChange(!groupByRealm)
          }}
        >
          Group by realm
        </FilterChipButton>
      ) : null}
    </div>
  )
}
