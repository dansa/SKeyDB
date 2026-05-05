import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'

const DATABASE_CONTROL_CLASS_NAME =
  'h-10 border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.9),rgba(8,13,24,0.84))] hover:border-slate-500/70 sm:h-8 [color-scheme:dark]'

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
  return (
    <CollectionSortControls
      compactControlClassName={DATABASE_CONTROL_CLASS_NAME}
      compactDirectionButtonClassName={DATABASE_CONTROL_CLASS_NAME}
      compactLeadingLabel='Sort'
      getSortDirectionLabel={getSortDirectionLabel}
      getSortLabel={getSortLabel}
      layout='compact'
      onSortDirectionToggle={onSortDirectionToggle}
      onSortKeyChange={onSortKeyChange}
      sortDirection={sortDirection}
      sortDirectionAriaLabel={sortDirectionAriaLabel}
      sortKey={sortKey}
      sortOptions={sortOptions}
      sortSelectAriaLabel={sortSelectAriaLabel}
      compactTrailingAction={
        groupByRealm !== undefined && onGroupByRealmChange ? (
          <FilterChipButton
            active={groupByRealm}
            onClick={() => {
              onGroupByRealmChange(!groupByRealm)
            }}
          >
            Group by realm
          </FilterChipButton>
        ) : null
      }
    />
  )
}
