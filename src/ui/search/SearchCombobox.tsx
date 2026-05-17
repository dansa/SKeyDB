import {useEffect, useId, useRef, type ReactNode} from 'react'

import {FaMagnifyingGlass} from 'react-icons/fa6'

interface SearchComboboxProps<TResult> {
  containerRef?: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  activeIndex: number
  isOpen: boolean
  query: string
  results: TResult[]
  inputAriaLabel: string
  placeholder: string
  emptyMessage: string
  getResultId: (result: TResult) => string | number
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onInputFocus?: React.FocusEventHandler<HTMLInputElement>
  onQueryChange: (value: string) => void
  onSelectResult: (result: TResult) => void
  renderResult: (result: TResult, active: boolean) => ReactNode
}

export function SearchCombobox<TResult>({
  containerRef,
  inputRef,
  activeIndex,
  isOpen,
  query,
  results,
  inputAriaLabel,
  placeholder,
  emptyMessage,
  getResultId,
  onInputKeyDown,
  onInputFocus,
  onQueryChange,
  onSelectResult,
  renderResult,
}: SearchComboboxProps<TResult>) {
  const hasResults = query.trim().length > 0 && results.length > 0
  const showEmptyState = query.trim().length > 0 && results.length === 0
  const isExpanded = isOpen && (hasResults || showEmptyState)
  const optionRefs = useRef<Record<number, HTMLButtonElement | null>>({})
  const searchId = useId()
  const resultsId = `${searchId}-results`
  const clampedActiveIndex = hasResults
    ? Math.min(Math.max(activeIndex, 0), results.length - 1)
    : -1
  const activeResult = hasResults ? results[clampedActiveIndex] : undefined
  const activeOptionId = activeResult
    ? `${searchId}-option-${String(getResultId(activeResult))}`
    : undefined

  useEffect(() => {
    if (!hasResults) {
      return
    }

    const activeOption = optionRefs.current[clampedActiveIndex]
    if (typeof activeOption?.scrollIntoView !== 'function') {
      return
    }

    activeOption.scrollIntoView({block: 'nearest'})
  }, [clampedActiveIndex, hasResults])

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
          aria-label={inputAriaLabel}
          autoComplete='off'
          className='w-full bg-transparent text-sm text-slate-100 outline-hidden placeholder:text-slate-500'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          onFocus={onInputFocus}
          onKeyDown={onInputKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          role='combobox'
          spellCheck={false}
          type='text'
          value={query}
        />
      </div>
      {isExpanded ? (
        <div className='absolute top-[calc(100%+0.35rem)] right-0 left-0 z-[905] border border-amber-200/35 bg-slate-950/[.985] shadow-[0_16px_36px_rgba(2,6,23,0.62)]'>
          <div className='ui-scrollbar max-h-72 overflow-y-auto py-1' id={resultsId} role='listbox'>
            {results.map((result, index) => {
              const active = index === clampedActiveIndex
              const optionId = `${searchId}-option-${String(getResultId(result))}`

              return (
                <button
                  aria-selected={active}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    active ? 'bg-amber-200/10' : 'hover:bg-slate-900/85'
                  }`}
                  id={optionId}
                  key={String(getResultId(result))}
                  ref={(element) => {
                    optionRefs.current[index] = element
                  }}
                  onClick={() => {
                    onSelectResult(result)
                  }}
                  role='option'
                  tabIndex={-1}
                  type='button'
                >
                  {renderResult(result, active)}
                </button>
              )
            })}
            {showEmptyState ? (
              <div className='px-3 py-3 text-xs text-slate-500'>{emptyMessage}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
