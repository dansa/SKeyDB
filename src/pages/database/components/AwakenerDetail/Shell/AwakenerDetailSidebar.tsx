import {memo, useEffect, useId, useMemo, useState} from 'react'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {
  hasAwakenerSubstatScaling,
  resolveAwakenerStatsForLevel,
} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import {
  type AwakenerFull,
  type AwakenerFullStats,
  type AwakenerStatScaling,
  type AwakenerSubstatScaling,
} from '@/domain/awakeners-full'
import {
  getColoredMainstatIcon,
  getMainstatAccentColor,
  getMainstatIcon,
  type MainstatKey,
} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'

import {scaledFontStyle} from '../../../utils/font-scale'
import {AwakenerLevelSlider} from '../../DatabaseMain'
import {usePopoverStore} from '../../RichTextPopovers/trail/usePopoverStore'
import {DetailLevelSlider, SkillLevelSlider} from '../Controls'

const STAT_DISPLAY_ORDER = [
  'CON',
  'ATK',
  'DEF',
  'CritRate',
  'CritDamage',
  'AliemusRegen',
  'KeyflareRegen',
  'RealmMastery',
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

const PRIMARY_STAT_KEYS = new Set(['CON', 'ATK', 'DEF'])
const PRIMARY_STAT_ORDER = STAT_DISPLAY_ORDER.filter((key) => PRIMARY_STAT_KEYS.has(key))
const SECONDARY_STAT_ORDER = STAT_DISPLAY_ORDER.filter((key) => !PRIMARY_STAT_KEYS.has(key))
const PSYCHE_SURGE_OFFSETS = Array.from({length: 13}, (_, index) => index)
const SIDEBAR_SCALING_VALUE_BASE_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-help font-bold text-slate-200 [--db-dash-strength:34%] [--db-dash-hover-strength:44%] hover:text-slate-100'

type SidebarScalingPreviewSource = AwakenerFull

function parseScalingPreviewValue(rawValue: string): {value: number; suffix: string} | null {
  const match = /^(-?\d+(?:\.\d+)?)(%)?$/.exec(rawValue.trim())
  if (!match) {
    return null
  }
  const [, value, suffix = ''] = match
  return {value: Number(value), suffix}
}

const SidebarAttributes = memo(function SidebarAttributes({
  stats,
  substatScaling,
  statScaling,
  dominantPrimaryScaling,
  compact,
  enlightenOffset,
  scalingPreviewSource,
  level,
}: {
  stats: AwakenerFullStats
  substatScaling: AwakenerSubstatScaling | null
  statScaling: AwakenerStatScaling | null
  dominantPrimaryScaling: number | null
  compact?: boolean
  enlightenOffset: number
  scalingPreviewSource: SidebarScalingPreviewSource | null
  level: number
}) {
  const trail = usePopoverStore((state) => state.trail)
  const openRoot = usePopoverStore((state) => state.openRoot)
  const clear = usePopoverStore((state) => state.clear)
  const updateRenderContext = usePopoverStore((state) => state.updateRenderContext)

  const ownerId = useId()

  const renderContext = useMemo(
    () => ({
      fullData: scalingPreviewSource ?? null,
      cardNames: new Set<string>(),
      skillLevel: level,
      stats,
    }),
    [scalingPreviewSource, level, stats],
  )

  useEffect(() => {
    updateRenderContext(renderContext, ownerId)
  }, [renderContext, ownerId, updateRenderContext])

  const activeTrailKeys = new Set(trail.map((t) => t.key))

  function renderStatRow(key: (typeof STAT_DISPLAY_ORDER)[number]) {
    const value = stats[key]
    const scaledSubstat = substatScaling?.[key as keyof AwakenerSubstatScaling]
    const mainstatKey = STAT_TO_MAINSTAT_KEY[key]
    const icon = getMainstatIcon(mainstatKey)
    const coloredIcon = getColoredMainstatIcon(mainstatKey)
    const accentColor = getMainstatAccentColor(mainstatKey)
    const statTitle = scaledSubstat
      ? `Level scaling: +${scaledSubstat} per 10 levels to Lv. 60`
      : undefined
    const isPrimaryStat = PRIMARY_STAT_KEYS.has(key)
    const isHighlightedSubstat = Boolean(scaledSubstat)
    const isDominantPrimaryStat =
      dominantPrimaryScaling !== null &&
      isPrimaryStat &&
      statScaling?.[key as keyof AwakenerStatScaling] === dominantPrimaryScaling

    const popoverKey = `scaling-preview-${key}`
    const isScalingPreviewOpen = activeTrailKeys.has(popoverKey)
    const labelClass = isHighlightedSubstat
      ? 'font-bold text-slate-400'
      : isPrimaryStat
        ? 'font-bold text-slate-400'
        : 'font-bold text-slate-500/60'
    const valueClass = isHighlightedSubstat
      ? `${SIDEBAR_SCALING_VALUE_BASE_CLASS} [--db-dash-bottom:-0.05em]`
      : isPrimaryStat
        ? isDominantPrimaryStat
          ? 'font-bold text-slate-200'
          : 'font-bold text-slate-200'
        : 'text-slate-500/60'

    const rowContent = (
      <>
        <div className='flex min-w-0 items-center gap-1.5'>
          <span
            className='ml-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center'
            style={{
              filter:
                isHighlightedSubstat || isPrimaryStat ? undefined : 'grayscale(1) opacity(0.3)',
              transform: 'translateY(-1px)',
            }}
          >
            {isPrimaryStat ? (
              <div
                className='h-full w-full'
                style={{
                  backgroundColor: accentColor,
                  WebkitMaskImage: `url(${icon ?? ''})`,
                  maskImage: `url(${icon ?? ''})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            ) : (
              <img alt='' className='h-full w-full object-contain' src={coloredIcon ?? icon} />
            )}
          </span>
          <span className={`${labelClass} whitespace-nowrap`} style={scaledFontStyle(9)}>
            {STAT_LABELS[key]}
          </span>
        </div>
        <span
          className={`${valueClass} text-right whitespace-nowrap`}
          style={scaledFontStyle(9)}
          title={statTitle}
        >
          {value}
        </span>
      </>
    )

    return (
      <div className={`relative ${compact ? '' : 'flex min-h-0 flex-1 items-center'}`} key={key}>
        {isHighlightedSubstat ? (
          <button
            className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center overflow-visible rounded-[3px] text-left leading-none transition-colors ${
              compact
                ? 'gap-x-1.5 px-0.5 py-1 text-[12px]'
                : 'h-full min-h-0 gap-x-3 px-2 py-0.5 text-[12px]'
            } ${isScalingPreviewOpen ? 'bg-white/4' : 'hover:bg-white/3'}`}
            onClick={(event) => {
              if (isScalingPreviewOpen) {
                clear()
                return
              }
              if (!scalingPreviewSource) return
              const targetValues = PSYCHE_SURGE_OFFSETS.map((offset) => {
                const rawValue = resolveAwakenerStatsForLevel(scalingPreviewSource, level, offset)[
                  key as keyof AwakenerSubstatScaling
                ]
                return parseScalingPreviewValue(rawValue)
              })
              if (targetValues.some((entry) => entry === null)) return

              const typedValues = targetValues as {value: number; suffix: string}[]
              openRoot(
                {
                  key: popoverKey,
                  kind: 'scaling',
                  stat: STAT_LABELS[key],
                  suffix: typedValues[0]?.suffix ?? '',
                  values: typedValues.map((e) => e.value),
                  currentLevel: enlightenOffset,
                },
                event.currentTarget,
                event.currentTarget.getBoundingClientRect(),
                {
                  cardNames: new Set(),
                  fullData: scalingPreviewSource,
                  skillLevel: level,
                  stats,
                },
                ownerId,
              )
            }}
            type='button'
          >
            {rowContent}
          </button>
        ) : (
          <div
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center overflow-visible leading-none ${
              compact
                ? 'gap-x-1.5 px-0.5 py-1 text-[12px]'
                : 'min-h-0 flex-1 gap-x-3 px-2 py-0.5 text-[12px]'
            }`}
          >
            {rowContent}
          </div>
        )}
      </div>
    )
  }

  if (compact) {
    return (
      <div className='-mx-1.5 flex flex-col gap-y-2.5 pt-0.5'>
        <div className='grid grid-cols-3 items-center divide-x divide-white/10'>
          {PRIMARY_STAT_ORDER.map((key) => (
            <div className='px-0.5 first:pl-0 last:pr-0' key={key}>
              {renderStatRow(key)}
            </div>
          ))}
        </div>
        <div className='relative grid grid-cols-2 gap-x-2 gap-y-1.5'>
          <div className='absolute inset-y-0 left-1/2 w-px bg-white/10' />
          {SECONDARY_STAT_ORDER.map(renderStatRow)}
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-1 flex-col gap-y-0.5 pt-0.5'>
      {STAT_DISPLAY_ORDER.map(renderStatRow)}
    </div>
  )
})

type AwakenerDetailSidebarProps = Readonly<{
  awakener: Awakener
  enlightenOffset: number
  level: number
  onLevelChange: (level: number) => void
  onPsycheSurgeChange: (offset: number) => void
  onSkillLevelChange: (level: number) => void
  skillLevel: number
  scalingPreviewSource: SidebarScalingPreviewSource | null
  statScaling: AwakenerStatScaling | null
  stats: AwakenerFullStats | null
  substatScaling: AwakenerSubstatScaling | null
  compact?: boolean
  realmTint?: string
}>

export function AwakenerDetailSidebar({
  awakener,
  enlightenOffset,
  level,
  onLevelChange,
  onPsycheSurgeChange,
  onSkillLevelChange,
  skillLevel,
  scalingPreviewSource,
  statScaling,
  stats,
  substatScaling,
  compact,
  realmTint,
}: AwakenerDetailSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const displayName = useMemo(() => formatAwakenerNameForUi(awakener.name), [awakener.name])
  const cardAsset = useMemo(() => getAwakenerCardAsset(awakener.name), [awakener.name])
  const hasSubstatScaling = useMemo(
    () => hasAwakenerSubstatScaling(substatScaling),
    [substatScaling],
  )
  const shouldShowPortrait = compact !== true
  const dominantPrimaryScaling = useMemo(() => {
    return statScaling ? Math.max(statScaling.CON, statScaling.ATK, statScaling.DEF) : null
  }, [statScaling])

  return (
    <div className='flex h-full shrink-0 flex-col gap-3'>
      {shouldShowPortrait ? (
        <div className='aspect-2/3 w-full overflow-hidden border border-slate-500/40 bg-linear-to-b from-slate-800 to-slate-900'>
          {cardAsset ? (
            <img
              alt={`${displayName} card`}
              className='h-full w-full object-cover object-top'
              draggable={false}
              src={cardAsset}
            />
          ) : (
            <div className='h-full w-full bg-[radial-gradient(circle_at_50%_28%,rgba(125,165,215,0.18),rgba(6,12,24,0.92)_70%)]' />
          )}
        </div>
      ) : null}

      <div
        className={`flex flex-1 flex-col border border-white/4 bg-white/2 shadow-sm ${
          compact ? 'px-3 py-3' : 'px-3.5 py-3'
        }`}
      >
        {compact ? (
          <button
            className={`${isExpanded ? 'mb-2' : ''} flex w-full items-center justify-between text-left transition-opacity hover:opacity-80`}
            onClick={() => {
              setIsExpanded((prev) => !prev)
            }}
            type='button'
          >
            <span
              className='ui-title tracking-wide'
              style={{...scaledFontStyle(11), color: realmTint}}
            >
              {isExpanded ? 'Configuration' : 'Configuration / Attributes'}
            </span>
            <span className='whitespace-nowrap text-amber-100/50' style={scaledFontStyle(10)}>
              {isExpanded ? 'HIDE' : 'SHOW'}
            </span>
          </button>
        ) : (
          <div className='mb-2 flex items-center gap-1.5'>
            <span
              className='ui-title tracking-wide'
              style={{...scaledFontStyle(11), color: realmTint}}
            >
              Configuration
            </span>
          </div>
        )}

        {(isExpanded || !compact) && (
          <>
            <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
              <div className={compact ? 'space-y-2.5' : 'space-y-2'}>
                <AwakenerLevelSlider level={level} onChange={onLevelChange} />
                <SkillLevelSlider level={skillLevel} onChange={onSkillLevelChange} />
                {hasSubstatScaling ? (
                  <DetailLevelSlider
                    label='Psyche Surge'
                    level={enlightenOffset}
                    max={12}
                    min={0}
                    onChange={onPsycheSurgeChange}
                    valuePrefix='E3 +'
                  />
                ) : null}
              </div>
            </div>

            <div className='mt-4 mb-2 flex items-center gap-1.5'>
              <span
                className='ui-title tracking-wide'
                style={{...scaledFontStyle(11), color: realmTint}}
              >
                Attributes
              </span>
            </div>

            {stats ? (
              <SidebarAttributes
                compact={compact}
                dominantPrimaryScaling={dominantPrimaryScaling}
                enlightenOffset={enlightenOffset}
                level={level}
                scalingPreviewSource={scalingPreviewSource}
                statScaling={statScaling}
                stats={stats}
                substatScaling={substatScaling}
              />
            ) : (
              <p className='text-[11px] text-slate-500'>Loading...</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
