import {useState} from 'react'

import {FaChevronDown, FaChevronRight} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {OwnedTogglePill} from '@/components/ui/OwnedTogglePill'
import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'

import type {PickerTab} from '../types'

interface PickerSortingTogglesProps {
  pickerTab: PickerTab
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByRealm: boolean
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  allowDupes: boolean
  promoteRecommendedGear: boolean
  promoteMatchingWheelMainstats: boolean
  onAwakenerSortKeyChange: (value: AwakenerSortKey) => void
  onAwakenerSortDirectionToggle: () => void
  onAwakenerSortGroupByRealmChange: (value: boolean) => void
  onDisplayUnownedChange: (value: boolean) => void
  onSinkUnownedToBottomChange: (value: boolean) => void
  onAllowDupesChange: (value: boolean) => void
  onPromoteRecommendedGearChange: (value: boolean) => void
  onPromoteMatchingWheelMainstatsChange: (value: boolean) => void
}

function ToggleRow({
  label,
  value,
  onChange,
  inset = false,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
  inset?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 text-[10px] text-slate-300 ${inset ? 'pl-3' : ''}`}
    >
      <span className='overflow-hidden text-ellipsis whitespace-nowrap'>{label}</span>
      <OwnedTogglePill
        className='ownership-pill-builder'
        offLabel='Off'
        onLabel='On'
        onToggle={() => {
          onChange(!value)
        }}
        owned={value}
        variant='flat'
      />
    </div>
  )
}

export function PickerSortingToggles({
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
}: PickerSortingTogglesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const showRecommendationToggle =
    pickerTab === 'wheels' || pickerTab === 'covenants' || pickerTab === 'posses'

  return (
    <div className='px-2 pt-1.5'>
      <Button
        className='flex w-full items-center justify-between px-2 py-1 text-left text-[10px] tracking-wide uppercase'
        onClick={() => {
          setIsOpen((prev) => !prev)
        }}
        type='button'
      >
        <span>Sorting &amp; Toggles</span>
        {isOpen ? (
          <FaChevronDown aria-hidden className='text-[10px]' />
        ) : (
          <FaChevronRight aria-hidden className='text-[10px]' />
        )}
      </Button>

      {isOpen ? (
        <div className='border border-t-0 border-slate-500/45 bg-slate-900/40 px-2 py-2'>
          <div className='space-y-2'>
            {pickerTab === 'awakeners' ? (
              <CollectionSortControls
                groupByRealm={awakenerSortGroupByRealm}
                layout='stacked'
                onGroupByRealmChange={onAwakenerSortGroupByRealmChange}
                onSortDirectionToggle={onAwakenerSortDirectionToggle}
                onSortKeyChange={onAwakenerSortKeyChange}
                sortDirection={awakenerSortDirection}
                sortDirectionAriaLabel='Toggle picker sort direction'
                sortKey={awakenerSortKey}
                sortSelectAriaLabel='Picker sort key'
              />
            ) : null}

            <ToggleRow
              label='Display Unowned'
              onChange={onDisplayUnownedChange}
              value={displayUnowned}
            />

            {displayUnowned ? (
              <ToggleRow
                inset
                label='Move Unowned to Bottom'
                onChange={onSinkUnownedToBottomChange}
                value={sinkUnownedToBottom}
              />
            ) : null}

            <ToggleRow label='Allow Duplicates' onChange={onAllowDupesChange} value={allowDupes} />

            {showRecommendationToggle ? (
              <ToggleRow
                label='Promote Recommendations'
                onChange={onPromoteRecommendedGearChange}
                value={promoteRecommendedGear}
              />
            ) : null}

            {pickerTab === 'wheels' && promoteRecommendedGear ? (
              <ToggleRow
                inset
                label='Promote Mainstat Matches'
                onChange={onPromoteMatchingWheelMainstatsChange}
                value={promoteMatchingWheelMainstats}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
