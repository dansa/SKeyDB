import type {
  DatabaseDetailSharedPreferences,
  DatabaseWheelDetailPreferences,
} from '@/domain/database-detail-preferences'
import {clampAccountLevel} from '@/domain/gameplay-math-metadata'
import {clampWheelEnhanceLevel, formatWheelEnhanceLevelLabel} from '@/domain/wheel-enhance'
import {DetailSettingsPanel} from '@/ui/modal/DetailSettingsPanel'

interface WheelDetailSettingsPanelProps {
  preferences: DatabaseWheelDetailPreferences
  sharedPreferences: DatabaseDetailSharedPreferences
  onUpdateSharedPreferences: (nextPartial: Partial<DatabaseDetailSharedPreferences>) => void
  onUpdateWheelPreferences: (nextPartial: Partial<DatabaseWheelDetailPreferences>) => void
}

export function WheelDetailSettingsPanel({
  preferences,
  sharedPreferences,
  onUpdateSharedPreferences,
  onUpdateWheelPreferences,
}: WheelDetailSettingsPanelProps) {
  const defaultEnhanceLabel = formatWheelEnhanceLevelLabel(preferences.defaultEnhanceLevel)

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
      <label className='flex items-start gap-3 border border-slate-700/45 bg-slate-900/40 p-3'>
        <input
          checked={preferences.expandLoreByDefault}
          className='mt-0.5 size-3.5 rounded border border-slate-500/60 bg-slate-950/80 accent-amber-200'
          onChange={(event) => {
            onUpdateWheelPreferences({expandLoreByDefault: event.target.checked})
          }}
          type='checkbox'
        />
        <span className='min-w-0'>
          <span className='block text-[11px] text-slate-200'>Expand lore on open</span>
          <span className='block text-[10px] text-slate-500'>
            Opens long lore entries expanded by default when loading a wheel.
          </span>
        </span>
      </label>
      <div className='border border-slate-700/45 bg-slate-900/40 p-3'>
        <div className='flex items-center justify-between gap-3'>
          <span>
            <span className='block text-[11px] text-slate-200'>Default enlighten</span>
            <span className='block text-[10px] text-slate-500'>
              Applies when opening a different wheel next time.
            </span>
          </span>
          <span className='text-[10px] tracking-[0.16em] text-amber-100 uppercase'>
            {defaultEnhanceLabel}
          </span>
        </div>
        <input
          aria-label='Default enlighten'
          aria-valuetext={defaultEnhanceLabel}
          className='wheel-enhance-slider export-box-slider mt-3 block w-full'
          max={15}
          min={0}
          onChange={(event) => {
            onUpdateWheelPreferences({
              defaultEnhanceLevel: clampWheelEnhanceLevel(Number(event.target.value)),
            })
          }}
          step={1}
          type='range'
          value={preferences.defaultEnhanceLevel}
        />
      </div>
    </DetailSettingsPanel>
  )
}
