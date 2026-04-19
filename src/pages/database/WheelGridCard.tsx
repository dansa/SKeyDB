import {getRealmTint} from '@/domain/factions'
import {getMainstatIcon} from '@/domain/mainstats'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

import {databaseCardTitleClampStyle, databaseCardTitleClassName} from './database-card-typography'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface WheelGridCardProps {
  wheel: Wheel
  index: number
  onSelect: (wheelId: string) => void
}

export function WheelGridCard({wheel, index, onSelect}: WheelGridCardProps) {
  const asset = getWheelAssetById(wheel.id)
  const realmTint = getRealmTint(wheel.realm)
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const prioritizeImage = index < PRIORITIZED_GRID_IMAGE_COUNT

  return (
    <article className='collection-item-card group/card p-0.5'>
      <div
        className='relative aspect-[5/9] overflow-hidden p-[1px] shadow-[0_8px_20px_rgba(2,6,23,0.24)] transition-[transform,box-shadow] duration-300 group-hover/card:-translate-y-0.5 group-hover/card:shadow-[0_14px_30px_rgba(2,6,23,0.34)]'
        style={
          {
            '--realm-color': realmTint,
            background: `linear-gradient(180deg, color-mix(in srgb, var(--realm-color) 92%, white 8%), rgba(71,85,105,0.92))`,
          } as React.CSSProperties
        }
      >
        <div className='relative h-full w-full overflow-hidden bg-slate-900 transition-colors duration-300'>
          <button
            aria-label={`View details for ${wheel.name}`}
            className='absolute inset-0 z-30 cursor-pointer transition-[background-color,box-shadow] duration-300 group-hover/card:bg-white/5 group-hover/card:shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
            onClick={() => {
              onSelect(wheel.id)
            }}
            type='button'
          />

          {asset ? (
            <img
              alt={wheel.name}
              className='h-full w-full object-cover'
              decoding='async'
              draggable={false}
              fetchPriority={prioritizeImage ? 'high' : 'low'}
              loading={prioritizeImage ? 'eager' : 'lazy'}
              src={asset}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-500'>
              No Image
            </div>
          )}

          {mainstatIcon ? (
            <div className='pointer-events-none absolute top-2 right-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/20 bg-black/32 shadow-[0_2px_8px_rgba(2,6,23,0.24)] backdrop-blur-[1px]'>
              <img
                alt=''
                className='h-4 w-4 object-contain opacity-90'
                draggable={false}
                src={mainstatIcon}
              />
            </div>
          ) : null}

          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[46%] bg-gradient-to-t from-black/90 via-black/66 via-42% to-transparent'
          />

          <div className='pointer-events-none absolute right-0 bottom-0 left-0 z-20 px-2.5 pt-12 pb-2.5'>
            <div className='min-h-[2.2rem]'>
              <p className={databaseCardTitleClassName} style={databaseCardTitleClampStyle}>
                {wheel.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
