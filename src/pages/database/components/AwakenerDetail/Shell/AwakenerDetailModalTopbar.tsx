import {FaBars, FaTag, FaXmark} from 'react-icons/fa6'

import {FONT_SCALE_OPTIONS, type FontScale} from '../../../utils/font-scale'

type AwakenerDetailModalTopbarProps = Readonly<{
  fontScale: FontScale
  isScalingMenuOpen: boolean
  isTagsMenuOpen: boolean
  onClose: () => void
  onCloseScalingMenu: () => void
  onCloseTagsMenu: () => void
  onFontScaleChange: (fontScale: FontScale) => void
  onToggleScalingMenu: () => void
  onToggleTagsMenu: () => void
  scalingMenuRef: React.RefObject<HTMLDivElement | null>
  tags: string[]
  tagsMenuRef: React.RefObject<HTMLDivElement | null>
}>

export function AwakenerDetailModalTopbar({
  fontScale,
  isScalingMenuOpen,
  isTagsMenuOpen,
  onClose,
  onCloseScalingMenu,
  onCloseTagsMenu,
  onFontScaleChange,
  onToggleScalingMenu,
  onToggleTagsMenu,
  scalingMenuRef,
  tags,
  tagsMenuRef,
}: AwakenerDetailModalTopbarProps) {
  return (
    <div className='absolute top-3 right-3 z-20 flex items-center gap-4'>
      {tags.length > 0 && (
        <div className='relative flex items-center' ref={tagsMenuRef}>
          <button
            aria-label='Tags menu'
            className={`flex h-8 items-center gap-2.5 transition-all ${
              isTagsMenuOpen ? 'text-amber-100' : 'text-slate-400 hover:text-slate-200'
            }`}
            onClick={onToggleTagsMenu}
            type='button'
          >
            <span className='hidden text-[10px] font-bold tracking-widest uppercase lg:block'>
              Tags
            </span>
            <FaTag className='h-4 w-4 shrink-0' />
          </button>

          {isTagsMenuOpen && (
            <div className='absolute top-full right-0 mt-2 w-48 origin-top-right border border-white/10 bg-slate-950/90 p-1 shadow-2xl backdrop-blur-md'>
              <div className='flex flex-col gap-0.5'>
                {tags.map((tag) => (
                  <button
                    className='w-full px-3 py-2 text-center text-[11px] font-medium text-slate-400 uppercase transition-colors hover:bg-white/5 hover:text-amber-100'
                    key={tag}
                    onClick={onCloseTagsMenu}
                    type='button'
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className='relative flex items-center' ref={scalingMenuRef}>
        <button
          aria-label='Interface settings'
          className={`flex h-8 items-center gap-2.5 transition-all ${
            isScalingMenuOpen ? 'text-amber-100' : 'text-slate-400 hover:text-slate-200'
          }`}
          onClick={onToggleScalingMenu}
          type='button'
        >
          <span className='hidden text-[10px] font-bold tracking-widest uppercase lg:block'>
            Interface
          </span>
          <FaBars className='h-4 w-4 shrink-0' />
        </button>

        {isScalingMenuOpen && (
          <div className='absolute top-full right-0 mt-2 w-32 origin-top-right border border-white/10 bg-slate-950/90 p-1 shadow-2xl backdrop-blur-md'>
            <div className='flex flex-col gap-0.5'>
              {FONT_SCALE_OPTIONS.map((scaleOption) => (
                <button
                  className={`flex w-full items-center justify-center px-3 py-2 text-center text-[11px] transition-colors ${
                    fontScale === scaleOption.id
                      ? 'bg-amber-500/10 text-amber-100'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  key={scaleOption.id}
                  onClick={() => {
                    onFontScaleChange(scaleOption.id)
                    onCloseScalingMenu()
                  }}
                  type='button'
                >
                  <span className='font-medium capitalize'>{scaleOption.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        aria-label='Close detail'
        className='flex h-8 w-8 items-center justify-center text-slate-400 transition-colors hover:text-amber-100'
        onClick={onClose}
        type='button'
      >
        <FaXmark className='h-4 w-4' />
      </button>
    </div>
  )
}
