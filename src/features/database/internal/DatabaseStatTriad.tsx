import {getAwakenerTextColor, type AwakenerTextColorName} from '@/domain/awakeners-text-colors'
import {getMainstatIcon} from '@/domain/mainstats'

export interface StatTriadValues {
  CON: number
  ATK: number
  DEF: number
}

const STAT_DISPLAY: {key: keyof StatTriadValues; colorName: AwakenerTextColorName}[] = [
  {key: 'CON', colorName: 'heal'},
  {key: 'ATK', colorName: 'damage'},
  {key: 'DEF', colorName: 'shield'},
]

/**
 * Three-cell stat row used across database browse cards. Fixed geometry keeps
 * stat positions predictable while tabular numerals align values row-to-row.
 */
export function DatabaseStatTriad({stats}: {stats: StatTriadValues}) {
  return (
    <div
      aria-label={`Stats CON ${String(stats.CON)}, ATK ${String(stats.ATK)}, DEF ${String(stats.DEF)}`}
      className='database-stat-triad grid grid-cols-3 items-center gap-x-1 text-[11px] leading-none font-medium text-white/85 tabular-nums'
    >
      {STAT_DISPLAY.map(({key, colorName}) => {
        const icon = getMainstatIcon(key)
        return (
          <span key={key} className='database-stat-triad__cell flex min-w-0 items-center gap-1'>
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
  )
}
