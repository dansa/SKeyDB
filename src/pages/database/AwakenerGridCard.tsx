import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getRealmTint} from '@/domain/factions'
import {getMainstatIcon} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {databaseCardTitleClampStyle, databaseCardTitleClassName} from './database-card-typography'

const STAT_DISPLAY: {key: 'CON' | 'ATK' | 'DEF'; color: string}[] = [
  {key: 'CON', color: '#5e9177'},
  {key: 'ATK', color: '#a1525a'},
  {key: 'DEF', color: '#638ea6'},
]

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface AwakenerGridCardProps {
  awakener: Awakener
  index: number
  onSelect: (id: number) => void
}

export function AwakenerGridCard({awakener, index, onSelect}: AwakenerGridCardProps) {
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)
  const stats = awakener.stats
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
            aria-label={`View details for ${displayName}`}
            className='absolute inset-0 z-30 cursor-pointer transition-[background-color,box-shadow] duration-300 group-hover/card:bg-white/5 group-hover/card:shadow-[inset_0_0_10px_rgba(255,255,255,0.1)] focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-200/70 focus-visible:outline-none focus-visible:ring-inset'
            onClick={() => {
              onSelect(awakener.id)
            }}
            type='button'
          />

          {cardAsset ? (
            <img
              alt={displayName}
              className='h-full w-full object-cover object-top'
              decoding='async'
              draggable={false}
              fetchPriority={prioritizeImage ? 'high' : 'low'}
              loading={prioritizeImage ? 'eager' : 'lazy'}
              src={cardAsset}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-500'>
              No Image
            </div>
          )}

          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[52%] bg-gradient-to-t from-black/90 via-black/66 via-42% to-transparent'
          />

          {stats && (
            <div className='pointer-events-none absolute right-0 bottom-0 left-0 z-20 px-2.5 pt-12 pb-2.5'>
              <div className='space-y-1.5'>
                <div className='min-h-[2.2rem]'>
                  <p
                    className={`${databaseCardTitleClassName} text-[clamp(0.86rem,0.28vw+0.8rem,0.98rem)]`}
                    style={databaseCardTitleClampStyle}
                  >
                    {displayName}
                  </p>
                </div>
                <div className='flex items-center justify-center gap-1.5'>
                  {STAT_DISPLAY.map(({key, color}, index) => {
                    const icon = getMainstatIcon(key)
                    const isLast = index === STAT_DISPLAY.length - 1

                    return (
                      <div key={key} className='flex items-center'>
                        <span className='inline-flex items-center gap-0.5 font-["Droid_Serif"] text-[10px] leading-none font-bold text-white/92'>
                          {icon && (
                            <div
                              className='h-3 w-3 shrink-0'
                              style={{
                                backgroundColor: color,
                                WebkitMaskImage: `url(${icon})`,
                                maskImage: `url(${icon})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                              }}
                            />
                          )}
                          <span className='pt-[1px] tracking-tight tabular-nums'>{stats[key]}</span>
                        </span>
                        {!isLast && <div className='ml-1.5 h-3 w-px bg-white/18' />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
