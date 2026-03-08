import {useEffect, useState} from 'react'

import {FaChevronDown, FaChevronRight} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {OwnedTogglePill} from '@/components/ui/OwnedTogglePill'
import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'

import type {PickerTab} from './types'

const BUILDER_AWAKENER_SORT_EXPANDED_KEY = 'skeydb.builder.awakenerSortExpanded.v1'

interface BuilderSelectionControlsProps {
  pickerTab: PickerTab
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByRealm: boolean
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  allowDupes: boolean
  promoteRecommendedGear: boolean
  promoteMatchingWheelMainstats: boolean
  onAwakenerSortKeyChange: (nextKey: AwakenerSortKey) => void
  onAwakenerSortDirectionToggle: () => void
  onAwakenerSortGroupByRealmChange: (nextGroupByRealm: boolean) => void
  onDisplayUnownedChange: (displayUnowned: boolean) => void
  onSinkUnownedToBottomChange: (sinkUnownedToBottom: boolean) => void
  onAllowDupesChange: (allowDupes: boolean) => void
  onPromoteRecommendedGearChange: (promoteRecommendedGear: boolean) => void
  onPromoteMatchingWheelMainstatsChange: (promoteMatchingWheelMainstats: boolean) => void
}

export function BuilderSelectionControls({
  pickerTab,
  awakenerSortKey,
  awakenerSortDirection,
  awakenerSortGroupByRealm,
  displayUnowned,
  sinkUnownedToBottom,
  allowDupes,
  promoteRecommendedGear,
  promoteMatchingWheelMainstats,
  onAwakenerSortKeyChange,
  onAwakenerSortDirectionToggle,
  onAwakenerSortGroupByRealmChange,
  onDisplayUnownedChange,
  onSinkUnownedToBottomChange,
  onAllowDupesChange,
  onPromoteRecommendedGearChange,
  onPromoteMatchingWheelMainstatsChange,
}: BuilderSelectionControlsProps) {
  const [isAwakenerSortExpanded, setIsAwakenerSortExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    try {
      return window.localStorage.getItem(BUILDER_AWAKENER_SORT_EXPANDED_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(
        BUILDER_AWAKENER_SORT_EXPANDED_KEY,
        isAwakenerSortExpanded ? '1' : '0',
      )
    } catch {
      void 0
    }
  }, [isAwakenerSortExpanded])

  return (
    <div className='mt-2'>
      <Button
        aria-expanded={isAwakenerSortExpanded}
        className='w-full px-2 py-1.5 text-[11px] tracking-wide'
        onClick={() => {
          setIsAwakenerSortExpanded((current) => !current)
        }}
        type='button'
        variant='secondary'
      >
        <span className='inline-flex w-full items-center justify-between gap-2'>
          <span className='uppercase'>Sorting & Toggles</span>
          {isAwakenerSortExpanded ? (
            <FaChevronDown aria-hidden className='text-[13px]' />
          ) : (
            <FaChevronRight aria-hidden className='text-[13px]' />
          )}
        </span>
      </Button>
      <div
        className={
          isAwakenerSortExpanded
            ? '-mt-px space-y-2 border border-slate-500/45 bg-slate-900/45 p-2'
            : 'hidden'
        }
      >
        {pickerTab === 'awakeners' ? (
          <CollectionSortControls
            groupByRealm={awakenerSortGroupByRealm}
            layout='stacked'
            onGroupByRealmChange={onAwakenerSortGroupByRealmChange}
            onSortDirectionToggle={onAwakenerSortDirectionToggle}
            onSortKeyChange={onAwakenerSortKeyChange}
            sortDirection={awakenerSortDirection}
            sortDirectionAriaLabel='Toggle builder awakener sort direction'
            sortKey={awakenerSortKey}
            sortSelectAriaLabel='Builder awakener sort key'
          />
        ) : null}
        <div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
          <span>Display Unowned</span>
          <OwnedTogglePill
            className='ownership-pill-builder'
            offLabel='Off'
            onLabel='On'
            onToggle={() => {
              onDisplayUnownedChange(!displayUnowned)
            }}
            owned={displayUnowned}
            variant='flat'
          />
        </div>
        {displayUnowned ? (
          <div className='flex items-center justify-between gap-3 pl-3 text-xs text-slate-300'>
            <span>Move Unowned to Bottom</span>
            <OwnedTogglePill
              className='ownership-pill-builder'
              offLabel='Off'
              onLabel='On'
              onToggle={() => {
                onSinkUnownedToBottomChange(!sinkUnownedToBottom)
              }}
              owned={sinkUnownedToBottom}
              variant='flat'
            />
          </div>
        ) : null}
        <div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
          <span>Allow Dupes</span>
          <OwnedTogglePill
            className='ownership-pill-builder'
            offLabel='Off'
            onLabel='On'
            onToggle={() => {
              onAllowDupesChange(!allowDupes)
            }}
            owned={allowDupes}
            variant='flat'
          />
        </div>
        {pickerTab === 'wheels' || pickerTab === 'covenants' ? (
          <div className='flex items-center justify-between gap-3 text-xs text-slate-300'>
            <span>Promote Recommendations</span>
            <OwnedTogglePill
              className='ownership-pill-builder'
              offLabel='Off'
              onLabel='On'
              onToggle={() => {
                onPromoteRecommendedGearChange(!promoteRecommendedGear)
              }}
              owned={promoteRecommendedGear}
              variant='flat'
            />
          </div>
        ) : null}
        {pickerTab === 'wheels' && promoteRecommendedGear ? (
          <div className='flex items-center justify-between gap-3 pl-3 text-xs text-slate-300'>
            <span>Promote Mainstat Matches</span>
            <OwnedTogglePill
              className='ownership-pill-builder'
              offLabel='Off'
              onLabel='On'
              onToggle={() => {
                onPromoteMatchingWheelMainstatsChange(!promoteMatchingWheelMainstats)
              }}
              owned={promoteMatchingWheelMainstats}
              variant='flat'
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
