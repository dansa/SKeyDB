import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getRealmTint} from '@/domain/factions'
import {getMainstatIcon} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'

const STAT_DISPLAY: {key: 'CON' | 'ATK' | 'DEF'; color: string}[] = [
  {key: 'CON', color: '#5e9177'},
  {key: 'ATK', color: '#a1525a'},
  {key: 'DEF', color: '#638ea6'},
]

interface AwakenerGridCardProps {
  awakener: Awakener
  onSelect: (id: number) => void
}

export function AwakenerGridCard({awakener, onSelect}: AwakenerGridCardProps) {
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmTint = getRealmTint(awakener.realm)
  const stats = awakener.stats

  return (
    <article className='collection-item-card group/card p-1'>
      <div
        className='relative aspect-[5/9] overflow-hidden p-[1px] transition-all duration-300'
        style={
          {
            '--realm-color': realmTint,
            background: `linear-gradient(to bottom, var(--realm-color), #475569)`,
          } as React.CSSProperties
        }
      >
        <div className='relative h-full w-full overflow-hidden bg-slate-900 transition-all duration-300'>
          <button
            aria-label={`View details for ${displayName}`}
            className='absolute inset-0 z-30 cursor-pointer transition-all duration-300 group-hover/card:bg-white/5 group-hover/card:shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]'
            onClick={() => {
              onSelect(awakener.id)
            }}
            type='button'
          />

          {cardAsset ? (
            <img
              alt={displayName}
              className='h-full w-full object-cover object-top'
              draggable={false}
              src={cardAsset}
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center bg-slate-800 text-[10px] text-slate-500'>
              No Image
            </div>
          )}

          <div className='pointer-events-none absolute top-0 right-0 left-0 z-20 bg-gradient-to-b from-black/90 via-black/65 to-transparent p-2'>
            <p className='font-["Droid_Serif"] text-[15px] leading-[1.1] font-bold tracking-wide text-amber-100/90'>
              {displayName}
            </p>
          </div>

          {stats && (
            <div className='pointer-events-none absolute right-0 bottom-0 left-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pt-6 pb-2'>
              <div className='flex items-center justify-center gap-1.5'>
                {STAT_DISPLAY.map(({key, color}, index) => {
                  const icon = getMainstatIcon(key)
                  const isLast = index === STAT_DISPLAY.length - 1

                  return (
                    <div key={key} className='flex items-center'>
                      <span className='inline-flex items-center gap-0.5 font-["Droid_Serif"] text-[11px] leading-none font-bold text-white'>
                        {icon && (
                          <div
                            className='h-3.5 w-3.5 shrink-0'
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
                        <span className='pt-[1px] tracking-tighter tabular-nums'>{stats[key]}</span>
                      </span>
                      {!isLast && <div className='ml-1.5 h-3 w-[1px] bg-white/20' />}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
