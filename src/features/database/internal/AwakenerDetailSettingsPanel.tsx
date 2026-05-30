import {useState} from 'react'

import type {
  AwakenerDatabaseControls,
  AwakenerDatabaseSelection,
} from '@/domain/awakener-database-state'
import type {
  DatabaseAwakenerDetailPreferences,
  DatabaseDetailSharedPreferences,
} from '@/domain/database-detail-preferences'
import {
  DATABASE_AWAKENER_VISIBLE_TABS,
  DEFAULT_DATABASE_AWAKENER_TAB,
  type DatabaseAwakenerVisibleTab,
} from '@/domain/database-paths'
import {clampAccountLevel} from '@/domain/gameplay-math-metadata'
import {DetailSettingsPanel} from '@/ui/modal/DetailSettingsPanel'

import {AwakenerDetailStateControls} from './AwakenerDetailStateControls'

const DEFAULT_TAB_LABELS: Record<DatabaseAwakenerVisibleTab, string> = {
  upgrades: 'Upgrades',
  skills: 'Skills',
  builds: 'Builds',
  lore: 'Lore',
}

interface AwakenerDetailSettingsPanelProps {
  controls: AwakenerDatabaseControls
  preferences: DatabaseAwakenerDetailPreferences
  sharedPreferences: DatabaseDetailSharedPreferences
  onPatchDefaultSelection: (nextPartial: Partial<AwakenerDatabaseSelection>) => void
  onUpdateAwakenerPreferences: (nextPartial: Partial<DatabaseAwakenerDetailPreferences>) => void
  onUpdateSharedPreferences: (nextPartial: Partial<DatabaseDetailSharedPreferences>) => void
}

export function AwakenerDetailSettingsPanel({
  controls,
  preferences,
  sharedPreferences,
  onPatchDefaultSelection,
  onUpdateAwakenerPreferences,
  onUpdateSharedPreferences,
}: AwakenerDetailSettingsPanelProps) {
  const [showDefaultProgression, setShowDefaultProgression] = useState(false)

  return (
    <DetailSettingsPanel
      accountLevel={sharedPreferences.accountLevel}
      clickOutsideClosesPopovers={sharedPreferences.clickOutsideClosesPopovers}
      fontScale={sharedPreferences.fontScale}
      onAccountLevelChange={(nextAccountLevel) => {
        onUpdateSharedPreferences({accountLevel: clampAccountLevel(nextAccountLevel)})
      }}
      onClickOutsideClosesPopoversChange={(nextClickOutsideClosesPopovers) => {
        onUpdateSharedPreferences({clickOutsideClosesPopovers: nextClickOutsideClosesPopovers})
      }}
      onFontScaleChange={(nextFontScale) => {
        onUpdateSharedPreferences({fontScale: nextFontScale})
      }}
      onShowTagIconsChange={(nextShowTagIcons) => {
        onUpdateSharedPreferences({showTagIcons: nextShowTagIcons})
      }}
      showTagIcons={sharedPreferences.showTagIcons}
    >
      <div className='space-y-3'>
        <div className='space-y-2'>
          <label className='block text-left'>
            <span className='block text-[11px] text-slate-200'>Default tab</span>
            <select
              className='mt-1 w-full border border-slate-700/55 bg-slate-950 px-2 py-1.5 text-[11px] text-slate-200 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none'
              onChange={(event) => {
                const nextTab =
                  event.target.value === ''
                    ? null
                    : (event.target.value as DatabaseAwakenerVisibleTab)
                onUpdateAwakenerPreferences({defaultTab: nextTab})
              }}
              value={preferences.defaultTab ?? ''}
            >
              <option value=''>Upgrades (standard)</option>
              {DATABASE_AWAKENER_VISIBLE_TABS.flatMap((tab) =>
                tab === DEFAULT_DATABASE_AWAKENER_TAB
                  ? []
                  : [
                      <option key={tab} value={tab}>
                        {DEFAULT_TAB_LABELS[tab]}
                      </option>,
                    ],
              )}
            </select>
          </label>

          <label className='flex items-start gap-2 text-left'>
            <input
              checked={preferences.showVisibleScaling}
              className='mt-0.5 size-3.5 accent-amber-200'
              onChange={(event) => {
                onUpdateAwakenerPreferences({showVisibleScaling: event.target.checked})
              }}
              type='checkbox'
            />
            <span>
              <span className='block text-[11px] text-slate-200'>Show visible scaling</span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Show formulas inline as <span className='text-slate-400'>(24% ATK)</span> next to
                computed numbers.
              </span>
            </span>
          </label>
        </div>

        <div className='border border-slate-700/45 bg-slate-900/40'>
          <button
            aria-expanded={showDefaultProgression}
            className='flex w-full items-center justify-between px-3 py-2 text-left'
            onClick={() => {
              setShowDefaultProgression((prev) => !prev)
            }}
            type='button'
          >
            <span>
              <span className='block text-[11px] text-slate-200'>Default progression</span>
              <span className='block text-[10px] text-slate-500'>
                Applies when opening a different awakener next time.
              </span>
            </span>
            <span className='text-[10px] text-slate-500 uppercase'>
              {showDefaultProgression ? 'Hide' : 'Show'}
            </span>
          </button>
          {showDefaultProgression ? (
            <div className='border-t border-slate-700/45 p-3'>
              <AwakenerDetailStateControls
                compact
                controls={controls}
                onPatchSelection={onPatchDefaultSelection}
                selection={preferences.defaultSelection}
              />
            </div>
          ) : null}
        </div>
      </div>
    </DetailSettingsPanel>
  )
}
