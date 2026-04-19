import {useId, type CSSProperties, type ReactNode, type RefObject} from 'react'

import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'

interface CatalogFiltersShellProps {
  searchLabel: string
  searchPlaceholder: string
  query: string
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  children: ReactNode
}

interface CatalogFilterRowProps {
  label: string
  children: ReactNode
  controlsClassName?: string
}

interface CatalogFilterChipButtonProps {
  active: boolean
  children: ReactNode
  onClick: () => void
  style?: CSSProperties
}

interface CatalogChipOption<TValue extends string> {
  id: TValue
  label: ReactNode
  iconSrc?: string | null
  activeStyle?: CSSProperties
}

interface CatalogChipFilterRowProps<TValue extends string> {
  activeId: TValue
  label: string
  onChange: (next: TValue) => void
  options: readonly CatalogChipOption<TValue>[]
  controlsClassName?: string
}

interface CatalogRealmFilterRowProps<TValue extends string> {
  activeRealm: TValue
  allLabel?: ReactNode
  label?: string
  onChange: (next: TValue) => void
  realms: readonly TValue[]
}

interface CatalogCompactSortRowProps<TSortKey extends string> {
  sortKey: TSortKey
  sortDirection: CollectionSortDirection
  onSortKeyChange: (nextKey: TSortKey) => void
  onSortDirectionToggle: () => void
  sortOptions: readonly TSortKey[]
  sortSelectAriaLabel: string
  sortDirectionAriaLabel: string
  getSortLabel?: (sortKey: TSortKey) => string
  trailingContent?: ReactNode
}

function chipClass(active: boolean): string {
  return `inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors ${
    active
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

export function CatalogFilterRow({children, controlsClassName, label}: CatalogFilterRowProps) {
  return (
    <div className='flex items-center gap-3'>
      <span className='w-14 shrink-0 text-[10px] tracking-wide text-slate-500 uppercase'>
        {label}
      </span>
      <div className={controlsClassName ?? 'flex flex-wrap items-center gap-1.5'}>{children}</div>
    </div>
  )
}

export function CatalogFilterChipButton({
  active,
  children,
  onClick,
  style,
}: CatalogFilterChipButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={`${chipClass(active)} focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none`}
      onClick={onClick}
      style={style}
      type='button'
    >
      {children}
    </button>
  )
}

export function CatalogChipFilterRow<TValue extends string>({
  activeId,
  controlsClassName,
  label,
  onChange,
  options,
}: CatalogChipFilterRowProps<TValue>) {
  return (
    <CatalogFilterRow controlsClassName={controlsClassName} label={label}>
      {options.map((option) => (
        <CatalogFilterChipButton
          active={activeId === option.id}
          key={option.id}
          onClick={() => {
            onChange(option.id)
          }}
          style={activeId === option.id ? option.activeStyle : undefined}
        >
          {option.iconSrc ? (
            <img
              alt=''
              className='h-3.5 w-3.5 object-contain'
              draggable={false}
              src={option.iconSrc}
            />
          ) : null}
          {option.label}
        </CatalogFilterChipButton>
      ))}
    </CatalogFilterRow>
  )
}

export function CatalogRealmFilterRow<TValue extends string>({
  activeRealm,
  allLabel = 'All',
  label = 'Realm',
  onChange,
  realms,
}: CatalogRealmFilterRowProps<TValue>) {
  const options = [
    {id: 'ALL' as TValue, label: allLabel},
    ...realms.map((realm) => ({
      id: realm,
      label: getRealmLabel(realm),
      iconSrc: getRealmIcon(realm),
      activeStyle: (() => {
        const tint = getRealmTint(realm)
        return {borderColor: `${tint}88`, color: tint}
      })(),
    })),
  ]

  return (
    <CatalogChipFilterRow
      activeId={activeRealm}
      label={label}
      onChange={onChange}
      options={options}
    />
  )
}

export function CatalogCompactSortRow<TSortKey extends string>({
  getSortLabel,
  onSortDirectionToggle,
  onSortKeyChange,
  sortDirection,
  sortDirectionAriaLabel,
  sortKey,
  sortOptions,
  sortSelectAriaLabel,
  trailingContent,
}: CatalogCompactSortRowProps<TSortKey>) {
  return (
    <CatalogFilterRow label='Sort'>
      <CollectionSortControls
        getSortLabel={getSortLabel}
        layout='compact'
        onSortDirectionToggle={onSortDirectionToggle}
        onSortKeyChange={onSortKeyChange}
        sortDirection={sortDirection}
        sortDirectionAriaLabel={sortDirectionAriaLabel}
        sortKey={sortKey}
        sortOptions={sortOptions}
        sortSelectAriaLabel={sortSelectAriaLabel}
      />
      {trailingContent}
    </CatalogFilterRow>
  )
}

export function CatalogFiltersShell({
  children,
  filteredCount,
  onQueryChange,
  query,
  searchInputRef,
  searchLabel,
  searchPlaceholder,
  totalCount,
}: CatalogFiltersShellProps) {
  const searchInputId = useId()

  return (
    <div className='space-y-2 border-b border-slate-600/40 pb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <label className='sr-only' htmlFor={searchInputId}>
          {searchLabel}
        </label>
        <input
          autoComplete='off'
          className='max-w-md min-w-0 flex-1 border border-slate-800/95 bg-slate-950/90 px-3 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          id={searchInputId}
          name='database-search'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          placeholder={searchPlaceholder}
          ref={searchInputRef}
          type='search'
          value={query}
        />
        <span className='text-[10px] text-slate-400'>
          {filteredCount}/{totalCount}
        </span>
      </div>
      {children}
    </div>
  )
}
