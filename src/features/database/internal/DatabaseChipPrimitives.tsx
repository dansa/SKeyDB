import {useId, type CSSProperties, type ReactNode} from 'react'

import {getRealmAccent, getRealmIcon, getRealmLabel} from '@/domain/realms'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'

interface CatalogRealmFilterRowProps<TValue extends string> {
  activeRealm: TValue
  allLabel?: ReactNode
  label?: string
  onChange: (next: TValue) => void
  realms: readonly TValue[]
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
    },
    ...realms.map((realm) => ({
      id: realm,
      label: getRealmLabel(realm),
      iconSrc: getRealmIcon(realm),
      activeStyle: (() => {
        const accent = getRealmAccent(realm)
        return {borderColor: `${accent}88`, color: accent}
      })(),
    })),
  ]

  return (
    <ChipFilterRow
      activeId={activeRealm}
      defaultId={'ALL' as TValue}
      label={label}
      onChange={onChange}
      options={options}
    />
  )
}

export interface CatalogMobileFilterOption<TValue extends string> {
  id: TValue
  label: ReactNode
  summaryLabel: string
  iconSrc?: string | null
  activeStyle?: CSSProperties
}

export interface CatalogMobileFilterGroupItem<TKey extends string> {
  activeId: string
  defaultId: string
  key: TKey
  label: string
  onChange: (next: string) => void
  options: readonly CatalogMobileFilterOption<string>[]
  toggleClassName?: string
}

interface CatalogMobileFilterGroupProps<TKey extends string> {
  groups: readonly CatalogMobileFilterGroupItem<TKey>[]
  onOpenKeyChange: (next: TKey | null) => void
  openKey: TKey | null
}

export function CatalogMobileFilterGroup<TKey extends string>({
  groups,
  onOpenKeyChange,
  openKey,
}: CatalogMobileFilterGroupProps<TKey>) {
  const idPrefix = useId()

  return (
    <div className='space-y-1.5'>
      <div className='grid grid-cols-2 gap-1.5'>
        {groups.map((group) => {
          const controlsId = `${idPrefix}-${group.key}`
          const open = openKey === group.key

          return (
            <CatalogMobileFilterToggle
              activeId={group.activeId}
              className={group.toggleClassName}
              controlsId={controlsId}
              defaultId={group.defaultId}
              key={group.key}
              label={group.label}
              onOpenChange={(nextOpen) => {
                onOpenKeyChange(nextOpen ? group.key : null)
              }}
              open={open}
              options={group.options}
            />
          )
        })}
      </div>

      {groups.map((group) =>
        openKey === group.key ? (
          <CatalogMobileFilterPanel
            activeId={group.activeId}
            id={`${idPrefix}-${group.key}`}
            key={group.key}
            label={group.label}
            onChange={group.onChange}
            options={group.options}
          />
        ) : null,
      )}
    </div>
  )
}

interface CatalogMobileFilterToggleProps<TValue extends string> {
  activeId: TValue
  className?: string
  controlsId: string
  defaultId: TValue
  label: string
  onOpenChange: (next: boolean) => void
  open: boolean
  options: readonly CatalogMobileFilterOption<TValue>[]
}

export function CatalogMobileFilterToggle<TValue extends string>({
  activeId,
  className = '',
  controlsId,
  defaultId,
  label,
  onOpenChange,
  open,
  options,
}: CatalogMobileFilterToggleProps<TValue>) {
  const activeOption = options.find((option) => option.id === activeId)
  const isActive = activeId !== defaultId
  const stateClassName = open
    ? 'border-amber-300/52 bg-slate-950/72 text-amber-50 ring-1 ring-inset ring-amber-300/10'
    : isActive
      ? 'border-slate-600/85 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(10,15,28,0.64))] text-slate-200 hover:border-slate-500/80'
      : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'

  return (
    <button
      aria-controls={controlsId}
      aria-expanded={open}
      className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-[2px] border px-2.5 py-2 text-left text-[11px] leading-none font-medium transition-[background-color,border-color,color,box-shadow] duration-200 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none ${className} ${stateClassName}`}
      onClick={() => {
        onOpenChange(!open)
      }}
      type='button'
    >
      <span className={`tracking-[0.16em] uppercase ${open ? 'text-amber-200' : 'text-slate-400'}`}>
        {label}
      </span>
      <span className='flex min-w-0 items-center gap-2'>
        <span className={`truncate ${isActive && !open ? 'text-amber-100' : ''}`}>
          {activeOption?.summaryLabel ?? 'All'}
        </span>
        <span aria-hidden='true' className={open ? 'text-amber-200' : 'text-slate-500'}>
          {open ? '-' : '+'}
        </span>
      </span>
    </button>
  )
}

interface CatalogMobileFilterPanelProps<TValue extends string> {
  activeId: TValue
  id: string
  label: string
  onChange: (next: TValue) => void
  options: readonly CatalogMobileFilterOption<TValue>[]
}

export function CatalogMobileFilterPanel<TValue extends string>({
  activeId,
  id,
  label,
  onChange,
  options,
}: CatalogMobileFilterPanelProps<TValue>) {
  return (
    <div
      aria-label={`${label} filter options`}
      className='grid grid-cols-2 gap-1.5 min-[430px]:grid-cols-3'
      id={id}
      role='group'
    >
      {options.map((option) => (
        <FilterChipButton
          active={activeId === option.id}
          className={`w-full min-w-0 justify-start ${
            activeId === option.id ? '!border-amber-300/45 !bg-slate-950/62 !shadow-none' : ''
          }`}
          key={option.id}
          onClick={() => {
            onChange(activeId === option.id ? (options[0]?.id ?? option.id) : option.id)
          }}
          onContextMenu={(event) => {
            event.preventDefault()
            onChange(activeId === option.id ? (options[0]?.id ?? option.id) : option.id)
          }}
          style={activeId === option.id ? option.activeStyle : undefined}
        >
          {option.iconSrc ? (
            <img
              alt=''
              className='size-3.5 object-contain'
              draggable={false}
              src={option.iconSrc}
            />
          ) : null}
          <span className='truncate'>{option.label}</span>
        </FilterChipButton>
      ))}
    </div>
  )
}
