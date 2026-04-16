import {useEffect, useId, useRef} from 'react'

import {FaMagnifyingGlass} from 'react-icons/fa6'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getRealmLabel, getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'

interface AwakenerDetailSearchBarProps {
  containerRef?: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  activeIndex: number
  isOpen: boolean
  query: string
  results: Awakener[]
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onInputFocus?: React.FocusEventHandler<HTMLInputElement>
  onQueryChange: (value: string) => void
  onSelectAwakener: (awakener: Awakener) => void
}

export function AwakenerDetailSearchBar({
  containerRef,
  inputRef,
  activeIndex,
  isOpen,
  query,
  results,
  onInputKeyDown,
  onInputFocus,
  onQueryChange,
  onSelectAwakener,
}: AwakenerDetailSearchBarProps) {
  const hasResults = query.trim().length > 0 && results.length > 0
  const showEmptyState = query.trim().length > 0 && results.length === 0
  const isExpanded = isOpen && (hasResults || showEmptyState)
  const optionRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const searchId = useId()
  const resultsId = `${searchId}-results`
  const activeOptionId = hasResults
    ? `${searchId}-option-${String(results[activeIndex]?.id)}`
    : undefined

  useEffect(() => {
    if (!hasResults) {
      return
    }

    const activeOption = optionRefs.current[activeIndex]
    if (typeof activeOption?.scrollIntoView !== 'function') {
      return
    }

    activeOption.scrollIntoView({block: 'nearest'})
  }, [activeIndex, hasResults])

  return (
    <div className='relative w-full' data-detail-modal-external='' ref={containerRef}>
      <div className='flex items-center gap-2 border border-amber-200/45 bg-slate-950/[.97] px-3 py-2 shadow-[0_14px_34px_rgba(2,6,23,0.55)]'>
        <FaMagnifyingGlass className='h-3.5 w-3.5 shrink-0 text-slate-500' />
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete='list'
          aria-controls={resultsId}
          aria-expanded={isExpanded}
          aria-haspopup='listbox'
          aria-label='Jump to awakener'
          autoComplete='off'
          className='w-full bg-transparent text-sm text-slate-100 outline-hidden placeholder:text-slate-500'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          onFocus={onInputFocus}
          onKeyDown={onInputKeyDown}
          placeholder='Jump to awakener...'
          ref={inputRef}
          role='combobox'
          spellCheck={false}
          type='text'
          value={query}
        />
      </div>
      {isExpanded ? (
        <div className='absolute top-[calc(100%+0.35rem)] right-0 left-0 z-[905] border border-amber-200/35 bg-slate-950/[.985] shadow-[0_16px_36px_rgba(2,6,23,0.62)]'>
          <div
            className='database-scrollbar max-h-72 overflow-y-auto py-1'
            id={resultsId}
            role='listbox'
          >
            {results.map((awakener, index) => {
              const portrait = getAwakenerPortraitAsset(awakener.name)
              const active = index === activeIndex

              return (
                <button
                  aria-selected={active}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    active ? 'bg-amber-200/10' : 'hover:bg-slate-900/85'
                  }`}
                  id={`${searchId}-option-${String(awakener.id)}`}
                  key={awakener.id}
                  ref={(element) => {
                    optionRefs.current[index] = element
                  }}
                  onClick={() => {
                    onSelectAwakener(awakener)
                  }}
                  role='option'
                  tabIndex={-1}
                  type='button'
                >
                  <div className='h-9 w-9 shrink-0 overflow-hidden border border-slate-600/35 bg-slate-900/80'>
                    {portrait ? (
                      <img
                        alt=''
                        className='h-full w-full object-cover object-top'
                        draggable={false}
                        src={portrait}
                      />
                    ) : (
                      <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
                    )}
                  </div>
                  <div className='min-w-0'>
                    <div className='truncate text-sm text-amber-100'>
                      {formatAwakenerNameForUi(awakener.name)}
                    </div>
                    <div className='truncate text-[11px] text-slate-500'>
                      <span style={{color: getRealmTint(awakener.realm)}}>
                        {getRealmLabel(awakener.realm)}
                      </span>
                      {awakener.type ? (
                        <>
                          <span className='mx-1.5 text-slate-700'>·</span>
                          <span>
                            {awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
            {showEmptyState ? (
              <div className='px-3 py-3 text-xs text-slate-500'>
                No awakeners matched that search.
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
