import type {ReactNode} from 'react'

type DetailSettingsFontScale = 'small' | 'medium' | 'large'

interface DetailSettingsPanelProps {
  accountLevel: number
  children?: ReactNode
  clickOutsideClosesPopovers: boolean
  fontScale: DetailSettingsFontScale
  showTagIcons: boolean
  onAccountLevelChange: (nextAccountLevel: number) => void
  onClickOutsideClosesPopoversChange: (nextClickOutsideClosesPopovers: boolean) => void
  onFontScaleChange: (nextFontScale: DetailSettingsFontScale) => void
  onShowTagIconsChange: (nextShowTagIcons: boolean) => void
  generalSettings?: ReactNode
  toggleSettings?: ReactNode
  bottomSettings?: ReactNode
}

const FONT_SCALE_OPTIONS: {id: DetailSettingsFontScale; label: string}[] = [
  {id: 'small', label: 'S'},
  {id: 'medium', label: 'M'},
  {id: 'large', label: 'L'},
]

export function DetailSettingsPanel({
  accountLevel,
  children,
  clickOutsideClosesPopovers,
  fontScale,
  showTagIcons,
  onAccountLevelChange,
  onClickOutsideClosesPopoversChange,
  onFontScaleChange,
  onShowTagIconsChange,
  generalSettings,
  toggleSettings,
  bottomSettings,
}: DetailSettingsPanelProps) {
  return (
    <div className='absolute top-[calc(100%+0.45rem)] right-0 z-[905] w-[min(26rem,calc(100vw-2rem))] rounded-sm border border-white/10 bg-slate-950/98 p-3.5 shadow-2xl backdrop-blur-md'>
      <div className='space-y-3.5'>
        {/* General/Account Settings */}
        <div className='space-y-3'>
          <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-end'>
            <div>
              <p className='mb-1 text-[10px] tracking-[0.16em] text-slate-500 uppercase'>
                Default text size
              </p>
              <div className='flex items-center gap-1'>
                {FONT_SCALE_OPTIONS.map((option) => (
                  <button
                    className={`min-w-8 border px-2 py-1 text-[10px] tracking-wide uppercase transition-colors ${
                      fontScale === option.id
                        ? 'border-amber-200/40 bg-amber-200/10 text-amber-100'
                        : 'border-white/10 bg-slate-950/60 text-slate-400 hover:border-white/20 hover:bg-slate-950/80 hover:text-slate-200'
                    }`}
                    key={option.id}
                    onClick={() => {
                      onFontScaleChange(option.id)
                    }}
                    type='button'
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label>
              <span className='mb-1 block text-[10px] tracking-[0.16em] text-slate-500 uppercase'>
                Account level
              </span>
              <input
                aria-label='Account level'
                className='w-full border border-white/10 bg-slate-950/60 px-2 py-1 text-right text-[11px] text-amber-100 outline-none focus:border-amber-200/40'
                max={100}
                min={1}
                onBlur={(event) => {
                  event.currentTarget.value = String(accountLevel)
                }}
                onChange={(event) => {
                  onAccountLevelChange(Number(event.target.value))
                }}
                step={1}
                type='number'
                value={accountLevel}
              />
            </label>
          </div>

          {generalSettings}
        </div>

        {/* Toggles (both slot and shared) */}
        <div className='space-y-2.5 border-t border-white/5 pt-3'>
          {toggleSettings}

          <label className='flex w-full cursor-pointer items-start gap-2.5 text-left select-none'>
            <input
              checked={showTagIcons}
              className='mt-0.5 size-3.5 shrink-0 accent-amber-200'
              onChange={(event) => {
                onShowTagIconsChange(event.target.checked)
              }}
              type='checkbox'
            />
            <span className='min-w-0 flex-1'>
              <span className='block text-[11px] text-slate-200'>Show tag icons</span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Show overlay icons inline with colored mechanic tags in skills, popovers, and
                descriptions.
              </span>
            </span>
          </label>

          <label className='flex w-full cursor-pointer items-start gap-2.5 text-left select-none'>
            <input
              checked={clickOutsideClosesPopovers}
              className='mt-0.5 size-3.5 shrink-0 accent-amber-200'
              onChange={(event) => {
                onClickOutsideClosesPopoversChange(event.target.checked)
              }}
              type='checkbox'
            />
            <span className='min-w-0 flex-1'>
              <span className='block text-[11px] text-slate-200'>
                Click outside closes popovers
              </span>
              <span className='block text-[10px] leading-relaxed text-slate-500'>
                Clicking away from the popover stack closes all open popovers before closing the
                detail modal.
              </span>
            </span>
          </label>
        </div>

        {/* Bottom Settings / Progression */}
        {bottomSettings}

        {/* Fallback children rendering if any exist */}
        {children}
      </div>
    </div>
  )
}
