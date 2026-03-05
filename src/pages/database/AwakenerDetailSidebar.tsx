import { getAwakenerCardAsset } from '../../domain/awakener-assets'
import { formatAwakenerNameForUi } from '../../domain/name-format'
import { getMainstatIcon, type MainstatKey } from '../../domain/mainstats'
import type { Awakener } from '../../domain/awakeners'
import type { AwakenerFull } from '../../domain/awakeners-full'

const STAT_DISPLAY_ORDER = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'RealmMastery',
  'AliemusRegen',
  'KeyflareRegen',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const

const STAT_LABELS: Record<string, string> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'Crit Rate',
  CritDamage: 'Crit DMG',
  AliemusRegen: 'Aliemus Regen',
  KeyflareRegen: 'Keyflare Regen',
  RealmMastery: 'Realm Mastery',
  SigilYield: 'Sigil Yield',
  DamageAmplification: 'DMG Amp',
  DeathResistance: 'Death Resist',
}

const STAT_TO_MAINSTAT_KEY: Record<string, MainstatKey> = {
  CON: 'CON',
  ATK: 'ATK',
  DEF: 'DEF',
  CritRate: 'CRIT_RATE',
  CritDamage: 'CRIT_DMG',
  RealmMastery: 'REALM_MASTERY',
  AliemusRegen: 'ALIEMUS_REGEN',
  KeyflareRegen: 'KEYFLARE_REGEN',
  SigilYield: 'SIGIL_YIELD',
  DamageAmplification: 'DMG_AMP',
  DeathResistance: 'DEATH_RESISTANCE',
}

const PRIMARY_STATS = new Set(['CON', 'ATK', 'DEF'])

function hasGrowthStats(fullData: AwakenerFull): boolean {
  return Object.values(fullData.stats).some((v) => typeof v === 'string' && v.includes('(+'))
}

type AwakenerDetailSidebarProps = {
  awakener: Awakener
  fullData: AwakenerFull | null
  compact?: boolean
}

export function AwakenerDetailSidebar({ awakener, fullData, compact }: AwakenerDetailSidebarProps) {
  const displayName = formatAwakenerNameForUi(awakener.name)
  const cardAsset = getAwakenerCardAsset(awakener.name)

  return (
    <div className="flex shrink-0 flex-col gap-3">
      {!compact ? (
        <div className="aspect-[2/3] w-full overflow-hidden border border-slate-500/40 bg-gradient-to-b from-slate-800 to-slate-900">
          {cardAsset ? (
            <img
              alt={`${displayName} card`}
              className="h-full w-full object-cover object-top"
              draggable={false}
              src={cardAsset}
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]" />
          )}
        </div>
      ) : null}

      <div className="border border-slate-600/30 bg-slate-900/30 px-3 py-2.5">
        <h4 className="ui-title mb-2 text-[11px] uppercase tracking-wide text-slate-400">Attributes <span className="text-slate-500">(Lv. 60)</span></h4>

        {fullData ? (
          <div className={compact ? 'grid grid-cols-2 gap-x-4 gap-y-0.5' : 'space-y-0.5'}>
            {STAT_DISPLAY_ORDER.map((key) => {
              const value = fullData.stats[key]
              const isPrimary = PRIMARY_STATS.has(key)
              const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
              const icon = mainstatKey ? getMainstatIcon(mainstatKey) : undefined
              return (
                <div
                  className={`flex items-center justify-between text-[11px] ${isPrimary ? 'text-slate-200' : 'text-slate-300/80'}`}
                  key={key}
                >
                  <span className="flex items-center gap-1.5 text-slate-500">
                    {icon ? <img alt="" className="object-contain h-3.5 w-3.5 opacity-60" draggable={false} src={icon} /> : null}
                    {STAT_LABELS[key]}
                  </span>
                  <span>{value}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">Loading...</p>
        )}
        {fullData && hasGrowthStats(fullData) ? (
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            * Increases by this amount per{' '}
            <span className="border-b border-dotted border-slate-500/50 text-slate-400/90" title="Details coming soon">
              Edify
            </span>{' '}
            tier and{' '}
            <span className="border-b border-dotted border-slate-500/50 text-slate-400/90" title="Details coming soon">
              Psyche Surge
            </span>{' '}
            level
          </p>
        ) : null}
      </div>
    </div>
  )
}
