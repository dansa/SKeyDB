import {useCallback, useEffect, useRef, useState} from 'react'

import type {PublicRelicVariant} from '@/domain/relics'

import {buildRelicVariantLabels} from './relic-database-presentation'
import {scrollRelicVariantIntoView} from './relic-variant-scroll'

interface RelicVariantRailProps {
  itemName: string
  onSelect: (variantId: string) => void
  selectedId: string
  variants: readonly PublicRelicVariant[]
}

export function RelicVariantRail({
  itemName,
  onSelect,
  selectedId,
  variants,
}: RelicVariantRailProps) {
  const labels = buildRelicVariantLabels(variants)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const selectedRef = useRef<HTMLButtonElement | null>(null)
  const [scrollEdges, setScrollEdges] = useState({bottom: false, top: false})
  const updateScrollEdges = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport) return
    const next = {
      bottom: viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1,
      top: viewport.scrollTop > 1,
    }
    setScrollEdges((current) =>
      current.bottom === next.bottom && current.top === next.top ? current : next,
    )
  }, [])

  useEffect(() => {
    updateScrollEdges()
  }, [updateScrollEdges, variants.length])

  useEffect(() => {
    const viewport = scrollRef.current
    const selectedControl = selectedRef.current
    if (viewport && selectedControl) {
      scrollRelicVariantIntoView(viewport, selectedControl)
    }
    updateScrollEdges()
  }, [selectedId, updateScrollEdges])

  const recordedCount = `${variants.length.toString()} recorded`

  return (
    <section
      aria-label='Relic variants'
      className='h-52 shrink-0 border-t border-slate-700/55 bg-slate-950/72'
    >
      <div className='flex h-10 items-center justify-between border-b border-slate-800/80 px-4'>
        <span className='text-[0.62rem] tracking-[0.18em] text-slate-500 uppercase'>Variants</span>
        <span className='text-[0.62rem] text-slate-500 tabular-nums'>{recordedCount}</span>
      </div>
      <div className='relative h-[calc(100%-2.5rem)]'>
        <div
          className='ui-scrollbar h-full [scrollbar-gutter:stable] overflow-y-auto py-2'
          onScroll={updateScrollEdges}
          ref={scrollRef}
          tabIndex={variants.length > 1 ? 0 : undefined}
        >
          {variants.map((variant) => {
            const selected = variant.id === selectedId
            const label = labels.get(variant.id) ?? variant.label
            const distinctName = variant.name !== itemName && variant.name !== label
            return (
              <button
                aria-current={selected ? 'true' : undefined}
                aria-label={`Select relic variant ${label}`}
                className={`mx-2 flex min-h-10 w-[calc(100%-1rem)] items-center border-l-2 px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-amber-200/35 focus-visible:outline-none motion-reduce:transition-none ${selected ? 'border-amber-300/80 bg-amber-300/[.07] text-amber-100' : 'border-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-900/70 hover:text-slate-100'}`}
                key={variant.id}
                onClick={() => {
                  onSelect(variant.id)
                }}
                ref={selected ? selectedRef : undefined}
                type='button'
              >
                <span className='min-w-0'>
                  <span className='block truncate text-xs font-medium'>{label}</span>
                  {distinctName ? (
                    <span
                      className={`mt-0.5 block truncate text-[0.64rem] ${selected ? 'text-amber-100/55' : 'text-slate-500'}`}
                    >
                      {variant.name}
                    </span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
        {scrollEdges.top ? (
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 top-0 h-5 bg-linear-to-b from-slate-950 to-transparent'
          />
        ) : null}
        {scrollEdges.bottom ? (
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-linear-to-t from-slate-950 to-transparent'
          />
        ) : null}
      </div>
    </section>
  )
}
