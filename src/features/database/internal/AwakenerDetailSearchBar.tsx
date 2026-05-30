import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {SearchCombobox} from '@/ui/search/SearchCombobox'

import {DATABASE_ACCENT_TEXT_CLASS, getDatabaseAccentTextStyle} from './text-styles'

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
  return (
    <SearchCombobox
      activeIndex={activeIndex}
      containerRef={containerRef}
      emptyMessage='No awakeners matched that search.'
      getResultId={(awakener) => awakener.id}
      inputAriaLabel='Jump to awakener'
      inputRef={inputRef}
      isOpen={isOpen}
      onInputFocus={onInputFocus}
      onInputKeyDown={onInputKeyDown}
      onQueryChange={onQueryChange}
      onSelectResult={onSelectAwakener}
      placeholder='Jump to awakener…'
      query={query}
      renderResult={(awakener) => <AwakenerSearchResultRow awakener={awakener} />}
      results={results}
    />
  )
}

function AwakenerSearchResultRow({awakener}: {awakener: Awakener}) {
  const portrait = getAwakenerPortraitAsset(awakener.name)

  return (
    <>
      <div className='size-9 shrink-0 overflow-hidden border border-slate-600/35 bg-slate-900/80'>
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
          <span
            className={DATABASE_ACCENT_TEXT_CLASS}
            style={getDatabaseAccentTextStyle(getRealmAccent(awakener.realm))}
          >
            {getRealmLabel(awakener.realm)}
          </span>
          {awakener.type ? (
            <>
              <span className='mx-1.5 text-slate-700'>·</span>
              <span>{awakener.type.charAt(0) + awakener.type.slice(1).toLowerCase()}</span>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
