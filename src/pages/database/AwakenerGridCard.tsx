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
    <article className='collection-item-card group/collection p-1'>
      <div className='collection-card-frame relative aspect-[5/9] overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)]'>
        <button
          aria-label={`View details for ${displayName}`}
          className='absolute inset-0 z-[13]'
          onClick={() => {
            onSelect(awakener.id)
          }}
          type='button'
        />
        {cardAsset ? (
          <img
            alt={`${displayName} card`}
            className='collection-card-art h-full w-full object-cover object-top'
            draggable={false}
            src={cardAsset}
          />
        ) : (
          <span className='sigil-placeholder sigil-placeholder-card' />
        )}
        <span
          className='pointer-events-none absolute inset-0 z-10 border'
          style={{borderColor: realmTint}}
        />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 z-[11] bg-gradient-to-t from-slate-950/92 via-slate-950/70 to-transparent px-1.5 pt-5 pb-1.5'>
          <p className='ui-title text-[11px] leading-tight text-amber-100/95'>{displayName}</p>
          {stats ? (
            <div className='mt-0.5 flex items-center gap-2'>
              {STAT_DISPLAY.map(({key, color}) => {
                const icon = getMainstatIcon(key)
                return (
                  <span
                    className='inline-flex items-center gap-0.5 text-[10px]'
                    key={key}
                    style={{color}}
                  >
                    {icon ? (
                      <img alt={key} className='h-3 w-3 opacity-85' draggable={false} src={icon} />
                    ) : null}
                    {stats[key]}
                  </span>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
