import {memo, useEffect, useMemo, useState} from 'react'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {
  hasAwakenerSubstatScaling,
  resolveAwakenerStatsForLevel,
} from '@/domain/awakener-level-scaling'
import type {Awakener} from '@/domain/awakeners'
import type {
  AwakenerFull,
  AwakenerFullStats,
  AwakenerStatScaling,
  AwakenerSubstatScaling,
} from '@/domain/awakeners-full'
import {
  getColoredMainstatIcon,
  getMainstatAccentColor,
  getMainstatIcon,
  type MainstatKey,
} from '@/domain/mainstats'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {AwakenerLevelSlider} from '@/pages/database/components/DatabaseMain'
import {ScalingPopover} from '@/pages/database/components/RichTextPopovers/ScalingPopover'
import {scaledFontStyle} from '@/pages/database/utils/font-scale'

import {DetailLevelSlider, SkillLevelSlider} from '../Controls'

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

const PRIMARY_STAT_KEYS = new Set(['CON', 'ATK', 'DEF'])
const PRIMARY_STAT_ORDER = STAT_DISPLAY_ORDER.filter((key) => PRIMARY_STAT_KEYS.has(key))
const SECONDARY_STAT_ORDER = STAT_DISPLAY_ORDER.filter((key) => !PRIMARY_STAT_KEYS.has(key))
const PSYCHE_SURGE_OFFSETS = Array.from({length: 13}, (_, index) => index)
const SIDEBAR_SCALING_VALUE_BASE_CLASS =
  'db-dash-underline db-dash-underline-hover cursor-help font-bold text-slate-200 [--db-dash-strength:34%] [--db-dash-hover-strength:44%] hover:text-slate-100'

type SidebarScalingPreviewSource = Pick<
  AwakenerFull,
  'stats' | 'primaryScalingBase' | 'statScaling' | 'substatScaling'
>

interface SidebarScalingPopoverPosition {
  left: number
  top: number
}

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
  const [activeScalingKey, setActiveScalingKey] = useState<keyof AwakenerSubstatScaling | null>(
    null,
  )
  const [scalingPopoverPosition, setScalingPopoverPosition] =
    useState<SidebarScalingPopoverPosition | null>(null)

  const scalingPreview = useMemo(() => {
    if (!activeScalingKey || !scalingPreviewSource) {
      return null
    }

    const values = PSYCHE_SURGE_OFFSETS.map((offset) => {
      const rawValue = resolveAwakenerStatsForLevel(scalingPreviewSource, level, offset)[
        activeScalingKey
      ]
      return parseScalingPreviewValue(rawValue)
    })

    if (values.some((entry) => entry === null)) {
      return null
    }

    const typedValues = values as {value: number; suffix: string}[]
    return {
      suffix: typedValues[0]?.suffix ?? '',
      values: typedValues.map((entry) => entry.value),
    }
  }, [activeScalingKey, level, scalingPreviewSource])

  useEffect(() => {
    if (activeScalingKey === null) {
      return
    }

    function handleViewportChange() {
      setActiveScalingKey(null)
      setScalingPopoverPosition(null)
    }

    globalThis.addEventListener('resize', handleViewportChange)
    globalThis.addEventListener('scroll', handleViewportChange, true)
    return () => {
      globalThis.removeEventListener('resize', handleViewportChange)
      globalThis.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [activeScalingKey])

  function positionScalingPopover(trigger: HTMLButtonElement) {
    const anchorRect = trigger.getBoundingClientRect()
    const modalRect = trigger.closest('dialog')?.getBoundingClientRect()
    const boundary = modalRect ?? {
      top: 8,
      right: globalThis.innerWidth - 8,
      bottom: globalThis.innerHeight - 8,
      left: 8,
    }
    const estimatedPopoverWidth = 288
    const estimatedPopoverHeight = 236
    const gutter = 12

    let left = anchorRect.right + gutter
    if (left + estimatedPopoverWidth > boundary.right - 8) {
      left = anchorRect.left - estimatedPopoverWidth - gutter
    }
    left = Math.max(boundary.left + 8, Math.min(left, boundary.right - estimatedPopoverWidth - 8))

    let top = anchorRect.top
    if (top + estimatedPopoverHeight > boundary.bottom - 8) {
      top = anchorRect.bottom - estimatedPopoverHeight
    }
    top = Math.max(boundary.top + 8, Math.min(top, boundary.bottom - estimatedPopoverHeight - 8))

    setScalingPopoverPosition({left, top})
  }

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
    const isScalingPreviewOpen = activeScalingKey === key
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
        <span
          className={`flex min-w-0 items-center ${labelClass} ${compact ? 'gap-0.5' : 'gap-1.5'}`}
        >
          {isHighlightedSubstat && coloredIcon ? (
            <img
              alt=''
              className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} object-contain`}
              draggable={false}
              src={coloredIcon}
            />
          ) : icon ? (
            isPrimaryStat ? (
              <span
                className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`}
                style={{
                  backgroundColor: accentColor,
                  WebkitMaskImage: `url(${icon})`,
                  maskImage: `url(${icon})`,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                }}
              />
            ) : (
              <img
                alt=''
                className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} object-contain opacity-60`}
                draggable={false}
                src={icon}
              />
            )
          ) : null}
          <span className='whitespace-nowrap'>{STAT_LABELS[key]}</span>
        </span>
        <span
          className={`inline-flex items-center justify-end text-right ${valueClass}`}
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
              if (activeScalingKey === key) {
                setActiveScalingKey(null)
                setScalingPopoverPosition(null)
                return
              }
              positionScalingPopover(event.currentTarget)
              setActiveScalingKey(key as keyof AwakenerSubstatScaling)
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

        {isHighlightedSubstat &&
        isScalingPreviewOpen &&
        scalingPreview &&
        scalingPopoverPosition ? (
          <div
            className='fixed z-950'
            style={{
              left: `${String(scalingPopoverPosition.left)}px`,
              top: `${String(scalingPopoverPosition.top)}px`,
            }}
          >
            <ScalingPopover
              currentLevel={enlightenOffset}
              levelLabelPrefix='E3+'
              levelStart={0}
              onClose={() => {
                setActiveScalingKey(null)
              }}
              stat={STAT_LABELS[key]}
              stats={null}
              suffix={scalingPreview.suffix}
              values={scalingPreview.values}
            />
          </div>
        ) : null}
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
