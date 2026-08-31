import {FaChevronDown} from 'react-icons/fa6'

import {buildRelicVariantLabels} from './relic-database-presentation'

interface DatabaseFamilyVariantMobileSwitcherProps {
  entityLabel?: string
  onSelect: (variantId: string) => void
  selectedId: string
  variants: readonly {id: string; label: string; name: string}[]
}

export function DatabaseFamilyVariantMobileSwitcher({
  entityLabel = 'Relic',
  onSelect,
  selectedId,
  variants,
}: DatabaseFamilyVariantMobileSwitcherProps) {
  if (variants.length < 2) {
    return null
  }

  const labels = buildRelicVariantLabels(variants)
  const controlLabel = labels.get(selectedId) ?? 'Variant'

  return (
    <div className='shrink-0 border-b border-slate-800/75 py-3 md:hidden'>
      <div className='mb-1.5 flex items-center justify-between gap-3 text-[0.62rem] tracking-[0.16em] text-slate-500 uppercase'>
        <span>Variant</span>
        <span className='tabular-nums'>
          {(variants.findIndex((variant) => variant.id === selectedId) + 1).toString()} /{' '}
          {variants.length.toString()}
        </span>
      </div>
      <div className='relative'>
        <select
          aria-label={`${entityLabel} variant switcher`}
          className='ui-compact-control ui-compact-control--field h-11 w-full min-w-0 appearance-none border-slate-700/70 bg-slate-950/86 pr-11 text-xs text-slate-200 [color-scheme:dark]'
          onChange={(event) => {
            onSelect(event.target.value)
          }}
          title={controlLabel}
          value={selectedId}
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {labels.get(variant.id) ?? variant.label}
            </option>
          ))}
        </select>
        <FaChevronDown
          aria-hidden
          className='pointer-events-none absolute top-1/2 right-4 size-2.5 -translate-y-1/2 text-slate-500'
        />
      </div>
    </div>
  )
}
