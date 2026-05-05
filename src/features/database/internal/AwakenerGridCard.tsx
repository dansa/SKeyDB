import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import {getAwakenerTextColor, type AwakenerTextColorName} from '@/domain/awakeners-text-colors'
import {getMainstatIcon} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent} from '@/domain/realms'
import {
  databaseCardTitleClampStyle,
  databaseCardTitleClassName,
} from '@/ui/cards/database-card-typography'
import {DatabaseGridCardFrame} from '@/ui/cards/DatabaseGridCardFrame'

const STAT_DISPLAY: {key: 'CON' | 'ATK' | 'DEF'; colorName: AwakenerTextColorName}[] = [
  {key: 'CON', colorName: 'heal'},
  {key: 'ATK', colorName: 'damage'},
  {key: 'DEF', colorName: 'shield'},
]

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface AwakenerGridCardProps {
  awakener: Awakener
  index: number
  onSelect: (id: string) => void
}

export function AwakenerGridCard({awakener, index, onSelect}: AwakenerGridCardProps) {
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmAccent = getRealmAccent(awakener.realm)
  const stats = awakener.stats
  const prioritizeImage = index < PRIORITIZED_GRID_IMAGE_COUNT

  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${displayName}`}
      fadeHeightClass='h-[52%]'
      imageAlt={displayName}
      imageObjectClassName='object-cover object-top'
      imageSrc={cardAsset}
      onSelect={() => {
        onSelect(awakener.id)
      }}
      prioritizeImage={prioritizeImage}
      realmAccent={realmAccent}
    >
      {stats ? (
        <div className='space-y-1.5'>
          <p
            className={`${databaseCardTitleClassName} text-[clamp(0.86rem,0.28vw+0.8rem,0.98rem)]`}
            style={databaseCardTitleClampStyle}
          >
            {displayName}
          </p>
          <div className='flex items-center justify-center gap-3'>
            {STAT_DISPLAY.map(({key, colorName}) => {
              const icon = getMainstatIcon(key)

              return (
                <span
                  key={key}
                  className='inline-flex items-center gap-1 text-[11px] leading-none font-medium text-white/85 tabular-nums'
                >
                  {icon ? (
                    <span
                      aria-hidden
                      className='h-2.5 w-2.5 shrink-0'
                      style={{
                        backgroundColor: getAwakenerTextColor(colorName),
                        WebkitMaskImage: `url(${icon})`,
                        maskImage: `url(${icon})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                      }}
                    />
                  ) : null}
                  <span>{stats[key]}</span>
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
    </DatabaseGridCardFrame>
  )
}
