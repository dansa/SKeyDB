import {useCallback, useEffect, useMemo, useState, type CSSProperties} from 'react'

import enlightensStars from '@/assets/icons/Battle_Card_Buff_045.webp'
import type {Awakener} from '@/domain/awakeners'
import type {ResolvedAwakenerDatabaseShellView} from '@/domain/awakeners-database-view'
import {isSoulforgeTalent} from '@/domain/awakeners-full-contract'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {getRelicPortraitAssetByAssetId} from '@/domain/relic-assets'
import {getPortraitRelicByAwakenerId, loadRelicDescriptionById} from '@/domain/relics'

import {useDatabasePopoverControllerContext} from './database-popover-context'
import {DatabaseScopedRichDescription} from './DatabaseScopedRichDescription'
import {DetailSection, type DetailSectionItem} from './DetailSection'
import {getStarSize, scaledFontStyle, type FontScale} from './font-scale'
import {DATABASE_SECTION_TITLE_CLASS} from './text-styles'

interface AwakenerDetailUpgradesProps {
  awakener: Awakener
  shellView: ResolvedAwakenerDatabaseShellView | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  fontScale: FontScale
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

const ENLIGHTEN_ORDER = ['E1', 'E2', 'E3'] as const
const TALENT_ORDER = ['T1', 'T2', 'T3', 'T4'] as const
const TALENT_KEYS = new Set<string>(TALENT_ORDER)

function getEnlightenStarStyle(starStyle: ReturnType<typeof getStarSize>): CSSProperties {
  return {
    width: starStyle.width,
    height: starStyle.height,
    top: starStyle.top,
  }
}

function formatTalentLevelLabel(
  entry: ResolvedAwakenerDatabaseShellView['talents'][number],
  selection: ResolvedAwakenerDatabaseShellView['selection'],
) {
  const hasScaledDescription =
    entry.record.hasLevelScaledDescription ?? (entry.record.maxLevel ?? 1) > 1
  if (!hasScaledDescription) {
    return undefined
  }

  if (isSoulforgeTalent(entry.record) && selection.soulforgeLevel <= 0) {
    return 'Off'
  }

  if (entry.descriptionRank === undefined || entry.descriptionMaxRank === undefined) {
    return undefined
  }

  return `Lv. ${entry.descriptionRank.toString()}/${entry.descriptionMaxRank.toString()}`
}

export function AwakenerDetailUpgrades({
  awakener,
  shellView,
  referenceLayer,
  fontScale,
  showVisibleScaling = true,
  showTagIcons = true,
}: AwakenerDetailUpgradesProps) {
  const popoverController = useDatabasePopoverControllerContext()
  const portraitRelic = getPortraitRelicByAwakenerId(awakener.id)
  const [loadedPortraitRelicDescription, setLoadedPortraitRelicDescription] = useState<{
    relicId: string
    description: string
  } | null>(null)
  useEffect(() => {
    let isCurrent = true
    if (!portraitRelic) {
      return () => {
        isCurrent = false
      }
    }

    void loadRelicDescriptionById(portraitRelic.id).then((description) => {
      if (isCurrent) {
        setLoadedPortraitRelicDescription({relicId: portraitRelic.id, description})
      }
    })

    return () => {
      isCurrent = false
    }
  }, [portraitRelic])
  const portraitRelicDescription =
    loadedPortraitRelicDescription && loadedPortraitRelicDescription.relicId === portraitRelic?.id
      ? loadedPortraitRelicDescription.description
      : (portraitRelic?.description ?? '')
  const renderDescription = useCallback(
    (item: DetailSectionItem) => (
      <DatabaseScopedRichDescription
        descriptionMaxRank={item.descriptionMaxRank}
        descriptionRank={item.descriptionRank}
        formulaContext={shellView?.formulaContext}
        record={item.record}
        referenceLayer={referenceLayer}
        showTagIcons={showTagIcons}
        showVisibleScaling={showVisibleScaling}
        skillLevel={shellView?.skillLevel ?? 1}
        stats={shellView?.stats ?? null}
        text={item.description}
      />
    ),
    [
      referenceLayer,
      shellView?.formulaContext,
      shellView?.skillLevel,
      shellView?.stats,
      showTagIcons,
      showVisibleScaling,
    ],
  )

  const enlightenItems = useMemo(() => {
    if (!shellView) return []
    const items = []
    const starStyle = getStarSize(fontScale)

    for (const [index, key] of ENLIGHTEN_ORDER.entries()) {
      const entry = shellView.enlightens[index]
      const starCount = parseInt(key.replace('E', ''))

      items.push({
        key,
        label: (
          <span className={`relative inline-flex items-center ${starStyle.space}`}>
            {Array.from({length: starCount}).map((_, i) => (
              <img
                key={i}
                src={enlightensStars}
                alt={`E${(i + 1).toString()}`}
                className='relative'
                style={getEnlightenStarStyle(starStyle)}
              />
            ))}
          </span>
        ),
        name: entry.record.displayName,
        description: entry.resolved.description,
        record: entry.record,
        descriptionRank: entry.descriptionRank,
        descriptionMaxRank: entry.descriptionMaxRank,
      })
    }

    if (shellView.overExalt) {
      items.push({
        key: 'OverExalt',
        label: popoverController ? (
          <button
            className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
            onClick={(event) => {
              popoverController.openRootReferenceByName('Over Exalt', event)
            }}
            style={scaledFontStyle(12)}
            type='button'
          >
            Over-Exaltation
          </button>
        ) : (
          'Over-Exaltation'
        ),
        name: shellView.overExalt.record.displayName,
        description: shellView.overExalt.resolved.description,
        record: shellView.overExalt.record,
        descriptionRank: shellView.overExalt.descriptionRank,
        descriptionMaxRank: shellView.overExalt.descriptionMaxRank,
      })
    }

    const absoluteAxiom = shellView.enlightens.find((entry) => entry.key === 'AbsoluteAxiom')

    if (absoluteAxiom) {
      items.push({
        key: 'AbsoluteAxiom',
        label: popoverController ? (
          <button
            className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
            onClick={(event) => {
              popoverController.openRootReferenceByName('Absolute Axiom', event)
            }}
            style={scaledFontStyle(12)}
            type='button'
          >
            Absolute Axiom
          </button>
        ) : (
          'Absolute Axiom'
        ),
        name: absoluteAxiom.record.displayName,
        description: absoluteAxiom.resolved.description,
        record: absoluteAxiom.record,
        descriptionRank: absoluteAxiom.descriptionRank,
        descriptionMaxRank: absoluteAxiom.descriptionMaxRank,
      })
    }

    return items
  }, [fontScale, popoverController, shellView])

  if (!shellView) {
    return <p className='py-4 text-xs text-slate-400'>Loading…</p>
  }
  const talentItems: DetailSectionItem[] = []
  for (const entry of shellView.talents) {
    if (!TALENT_KEYS.has(entry.key)) {
      continue
    }

    talentItems.push({
      key: entry.key,
      label: formatTalentLevelLabel(entry, shellView.selection),
      name: entry.record.displayName,
      description: entry.resolved.description,
      record: entry.record,
      descriptionRank: entry.descriptionRank,
      descriptionMaxRank: entry.descriptionMaxRank,
    })
  }

  const portraitRelicAsset = portraitRelic
    ? getRelicPortraitAssetByAssetId(portraitRelic.assetId)
    : undefined

  return (
    <div className='space-y-4'>
      <div className='border border-slate-600/30 bg-slate-900/30'>
        <h4 className={DATABASE_SECTION_TITLE_CLASS} style={scaledFontStyle(14)}>
          Dimensional Image
        </h4>
        {portraitRelic ? (
          <div className='px-4 py-3'>
            <div className='flex items-start gap-3'>
              <div className='size-16 shrink-0 overflow-hidden'>
                {portraitRelicAsset ? (
                  <img
                    alt={`${portraitRelic.name} icon`}
                    className='h-full w-full object-cover object-center'
                    draggable={false}
                    src={portraitRelicAsset}
                  />
                ) : (
                  <div className='h-full w-full bg-[radial-gradient(circle_at_50%_35%,rgba(125,165,215,0.2),rgba(8,13,25,0.95)_70%)]' />
                )}
              </div>
              <div className='min-w-0 flex-1'>
                <p className='leading-relaxed text-slate-400' style={scaledFontStyle(12)}>
                  <DatabaseScopedRichDescription
                    referenceLayer={referenceLayer}
                    formulaContext={shellView.formulaContext}
                    showTagIcons={showTagIcons}
                    showVisibleScaling={showVisibleScaling}
                    skillLevel={shellView.skillLevel}
                    stats={shellView.stats}
                    text={portraitRelicDescription}
                  />
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className='px-4 pb-3 text-xs text-slate-400'>
            No dimensional image linked yet for this awakener.
          </p>
        )}
      </div>
      <DetailSection
        emptyMessage='No enlighten data available.'
        items={enlightenItems}
        renderDescription={renderDescription}
        title='Enlightens'
      />
      <DetailSection
        emptyMessage='No talent data available.'
        items={talentItems}
        renderDescription={renderDescription}
        title='Talents'
      />
    </div>
  )
}
