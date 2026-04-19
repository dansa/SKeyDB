import type {CSSProperties, ReactNode} from 'react'

import {getRealmAccent, getRealmIcon, getRealmLabel} from '@/domain/realms'

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

function chipClass(active: boolean): string {
  return `inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2.5 py-1.5 text-[11px] font-medium leading-none transition-[background-color,border-color,color,box-shadow] duration-200 sm:min-h-8 ${
    active
      ? 'border-amber-300/42 bg-[linear-gradient(180deg,rgba(251,191,36,0.16),rgba(245,158,11,0.07))] text-amber-50 shadow-[inset_0_1px_0_rgba(255,251,235,0.06)]'
      : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
  }`
}

export function CatalogFilterRow({
  children,
  controlsClassName,
  description,
  label,
}: CatalogFilterRowProps) {
  return (
    <div className='flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3'>
      <div className='shrink-0 sm:w-16 sm:pt-1.5'>
        <span className='text-[10px] tracking-[0.18em] text-slate-500 uppercase'>{label}</span>
        {description ? (
          <p className='mt-1 text-[11px] leading-snug text-slate-400'>{description}</p>
        ) : null}
      </div>
      <div className={controlsClassName ?? 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5'}>
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
    <CatalogChipFilterRow
      activeId={activeRealm}
      label={label}
      onChange={onChange}
      options={options}
    />
  )
}
