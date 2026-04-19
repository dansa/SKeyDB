import {getRealmAccent} from '@/domain/realms'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

interface WheelDetailArtworkProps {
  wheel: Wheel
  variant?: 'sidebar' | 'compact'
  onOpenFullArt?: () => void
}

export function WheelDetailArtwork({
  onOpenFullArt,
  wheel,
  variant = 'sidebar',
}: WheelDetailArtworkProps) {
  const asset = getWheelAssetById(wheel.id)
  const lineAccent = wheel.realm === 'NEUTRAL' ? '#f3eee1' : getRealmAccent(wheel.realm)
  const isCompact = variant === 'compact'
  const fullArtLabel = `View full art for ${wheel.name}`
  const rootClassName = isCompact
    ? 'w-[4.75rem] shrink-0'
    : 'relative flex min-h-full w-[85%] items-start justify-center px-5 py-6'
  const frameClassName = isCompact
    ? 'wheel-art-frame relative aspect-[430/872] w-full'
    : 'wheel-art-frame relative aspect-[430/872] w-full max-w-[16rem]'
  const hideFrameFromAccessibilityTree = !asset || !onOpenFullArt

  return (
    <div
      className={rootClassName}
      style={{'--wheel-art-line-color': lineAccent} as React.CSSProperties}
    >
      <div aria-hidden={hideFrameFromAccessibilityTree || undefined} className={frameClassName}>
        {isCompact ? null : (
          <>
            <div className='wheel-art-guide wheel-art-guide-top' />
            <div className='wheel-art-guide wheel-art-guide-bottom' />
            <div className='wheel-art-guide wheel-art-guide-left' />
            <div className='wheel-art-guide wheel-art-guide-right' />
          </>
        )}
        <div className='wheel-art-panel absolute inset-0'>
          {asset && onOpenFullArt ? (
            <button
              aria-label={fullArtLabel}
              className='block h-full w-full'
              onClick={onOpenFullArt}
              type='button'
            >
              <img
                alt=''
                className='block h-full w-full object-cover shadow-[0_16px_34px_rgba(2,6,23,0.28)] select-none'
                draggable={false}
                src={asset}
              />
            </button>
          ) : asset ? (
            <img
              alt={`${wheel.name} art`}
              className='block h-full w-full object-cover shadow-[0_16px_34px_rgba(2,6,23,0.28)] select-none'
              draggable={false}
              src={asset}
            />
          ) : (
            <div className='grid h-full w-full place-items-center bg-[#53637d] text-[0.625rem] tracking-[0.18em] text-slate-200/75 uppercase'>
              No Image
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
