import {getMainstatByKey, getMainstatIcon} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent, getRealmLabel} from '@/domain/realms'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import {SearchCombobox} from '@/ui/search/SearchCombobox'

interface WheelDetailSearchBarProps {
  containerRef?: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  activeIndex: number
  isOpen: boolean
  query: string
  results: Wheel[]
  onInputKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  onInputFocus?: React.FocusEventHandler<HTMLInputElement>
  onQueryChange: (value: string) => void
  onSelectWheel: (wheel: Wheel) => void
}

export function WheelDetailSearchBar({
  containerRef,
  inputRef,
  activeIndex,
  isOpen,
  query,
  results,
  onInputKeyDown,
  onInputFocus,
  onQueryChange,
  onSelectWheel,
}: WheelDetailSearchBarProps) {
  return (
    <SearchCombobox
      activeIndex={activeIndex}
      containerRef={containerRef}
      emptyMessage='No wheels matched that search.'
      getResultId={(wheel) => wheel.id}
      inputAriaLabel='Jump to wheel'
      inputRef={inputRef}
      isOpen={isOpen}
      onInputFocus={onInputFocus}
      onInputKeyDown={onInputKeyDown}
      onQueryChange={onQueryChange}
      onSelectResult={onSelectWheel}
      placeholder='Jump to wheel...'
      query={query}
      renderResult={(wheel) => <WheelSearchResultRow wheel={wheel} />}
      results={results}
    />
  )
}

function WheelSearchResultRow({wheel}: {wheel: Wheel}) {
  const asset = getWheelAssetById(wheel.id)
  const mainstatLabel = getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const ownerName = wheel.ownerAwakenerName ?? wheel.awakener
  const displayOwnerName = ownerName ? formatAwakenerNameForUi(ownerName) : null
  const realmLabel = getRealmLabel(wheel.realm)

  return (
    <>
      <div className='h-9 w-9 shrink-0 overflow-hidden border border-slate-600/35 bg-slate-900/80'>
        {asset ? (
          <img alt='' className='h-full w-full object-cover' draggable={false} src={asset} />
        ) : (
          <div className='h-full w-full bg-[radial-gradient(circle_at_50%_32%,rgba(233,192,94,0.18),rgba(6,12,24,0.92)_72%)]' />
        )}
      </div>
      <div className='min-w-0'>
        <div className='truncate text-sm text-amber-100'>{wheel.name}</div>
        <div className='flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-none text-slate-500'>
          <span className='shrink-0'>{wheel.rarity}</span>
          <span className='mx-1.5 text-slate-700'>·</span>
          <span className='shrink-0' style={{color: getRealmAccent(wheel.realm)}}>
            {realmLabel}
          </span>
          <span className='mx-1.5 text-slate-700'>·</span>
          <span className='inline-flex min-w-0 items-center gap-1 align-middle'>
            {mainstatIcon ? (
              <img
                alt=''
                className='h-3.5 w-3.5 shrink-0 object-contain opacity-80'
                draggable={false}
                src={mainstatIcon}
              />
            ) : null}
            <span className='leading-none'>{mainstatLabel}</span>
          </span>
          {displayOwnerName ? (
            <>
              <span className='mx-1.5 text-slate-700'>·</span>
              <span className='truncate leading-none'>{displayOwnerName}</span>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}
