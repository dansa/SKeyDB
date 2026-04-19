import {useEffect, useId, useState, type CSSProperties, type ReactNode, type RefObject} from 'react'

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
  description?: ReactNode
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
  mobileLabel?: string
  iconSrc?: string | null
  activeStyle?: CSSProperties
}

interface CatalogChipFilterRowProps<TValue extends string> {
  activeId: TValue
  label: string
  onChange: (next: TValue) => void
  options: readonly CatalogChipOption<TValue>[]
  controlsClassName?: string
  description?: ReactNode
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
  description?: ReactNode
}

function chipClass(active: boolean): string {
  return `inline-flex min-h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2.5 py-1.5 text-[11px] font-medium leading-none transition-[background-color,border-color,color,box-shadow] duration-200 ${
    active
      ? 'border-amber-300/42 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(245,158,11,0.07))] text-amber-50 shadow-[inset_0_1px_0_rgba(255,251,235,0.06)]'
      : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
  }`
}

function useCompactFilterLayout() {
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactLayout(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isCompactLayout
}

export function CatalogFilterRow({
  children,
  controlsClassName,
  description,
  label,
}: CatalogFilterRowProps) {
  const isCompactLayout = useCompactFilterLayout()

  return (
    <div
      className={
        isCompactLayout && !description
          ? 'flex items-center gap-3'
          : 'flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3'
      }
    >
      <div className={`shrink-0 ${isCompactLayout && !description ? 'w-16' : 'sm:w-16 sm:pt-1.5'}`}>
        <span className='text-[10px] tracking-[0.18em] text-slate-500 uppercase'>{label}</span>
        {description ? (
          <p className='mt-1 text-[11px] leading-snug text-slate-400'>{description}</p>
        ) : null}
      </div>
      <div className={controlsClassName ?? 'flex min-w-0 flex-wrap items-center gap-1.5'}>
        {children}
      </div>
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
  description,
  label,
  onChange,
  options,
}: CatalogChipFilterRowProps<TValue>) {
  const isCompactLayout = useCompactFilterLayout()

  if (isCompactLayout) {
    return (
      <CatalogFilterRow description={description} label={label}>
        <select
          aria-label={label}
          className='h-9 min-w-0 flex-1 rounded-[2px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.92),rgba(8,13,24,0.86))] px-2.5 text-sm text-slate-100 transition-colors outline-none focus:border-amber-300/60'
          onChange={(event) => {
            onChange(event.target.value as TValue)
          }}
          value={activeId}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.mobileLabel ?? (typeof option.label === 'string' ? option.label : option.id)}
            </option>
          ))}
        </select>
      </CatalogFilterRow>
    )
  }

  return (
    <CatalogFilterRow controlsClassName={controlsClassName} description={description} label={label}>
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
    {
      id: 'ALL' as TValue,
      label: allLabel,
      mobileLabel: typeof allLabel === 'string' ? allLabel : 'All',
    },
    ...realms.map((realm) => ({
      id: realm,
      label: getRealmLabel(realm),
      mobileLabel: getRealmLabel(realm),
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
  description,
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
    <CatalogFilterRow description={description} label='Sort'>
      <div className='min-w-0 flex-1 space-y-1 sm:space-y-1.5'>
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
        {trailingContent ? (
          <div className='flex flex-wrap items-center gap-1.5 text-[10px] tracking-[0.16em] text-slate-500 uppercase sm:gap-2'>
            {trailingContent}
          </div>
        ) : null}
      </div>
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
    <div className='space-y-3 border-b border-slate-700/35 pb-3 sm:space-y-3.5 sm:pb-4'>
      <div className='space-y-1.5 sm:space-y-2'>
        <div className='flex flex-wrap items-end justify-between gap-x-3 gap-y-1.5 text-[11px]'>
          <span className='tracking-[0.18em] text-slate-500 uppercase'>{searchLabel}</span>
          <span className='text-[11px] text-slate-400'>
            <span className='font-medium text-slate-100 tabular-nums'>{filteredCount}</span> shown
            <span aria-hidden='true' className='px-1 text-slate-600'>
              /
            </span>
            <span className='tabular-nums'>{totalCount}</span> total
          </span>
        </div>
        <div className='min-w-0'>
          <label className='sr-only' htmlFor={searchInputId}>
            {searchLabel}
          </label>
          <input
            autoComplete='off'
            className='h-9 w-full min-w-0 rounded-[2px] border border-slate-700/70 bg-[linear-gradient(180deg,rgba(13,20,34,0.92),rgba(8,13,24,0.86))] px-3 text-sm text-slate-100 transition-[border-color,background-color] outline-none placeholder:text-slate-500 focus:border-amber-300/60 sm:h-10'
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
        </div>
      </div>
      <div className='space-y-2.5 sm:space-y-3'>{children}</div>
    </div>
  )
}
