import type {PublicRelicVariant} from '@/domain/relics'

import {buildRelicVariantLabels} from './relic-database-presentation'

interface RelicVariantMobileSwitcherProps {
  onSelect: (variantId: string) => void
  selectedId: string
  variants: readonly PublicRelicVariant[]
}

export function RelicVariantMobileSwitcher({
  onSelect,
  selectedId,
  variants,
}: RelicVariantMobileSwitcherProps) {
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
      <select
        aria-label='Relic variant switcher'
        className='ui-compact-control ui-compact-control--field h-11 w-full min-w-0 border-slate-700/70 bg-slate-950/86 text-xs text-slate-200 [color-scheme:dark]'
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
    </div>
  )
}
