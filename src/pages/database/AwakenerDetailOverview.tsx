import {useCallback, useMemo} from 'react'

import enlightensStars from '@/assets/icons/Battle_Card_Buff_045.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {getRelicPortraitAssetByAssetId} from '@/domain/relic-assets'
import {getPortraitRelicByAwakenerIngameId} from '@/domain/relics'

import {DetailSection, type DetailSectionItem} from './DetailSection'
import {getStarSize, scaledFontStyle, type FontScale} from './font-scale'
import {RichDescription} from './RichDescription'
import {DATABASE_SECTION_TITLE_CLASS} from './text-styles'

interface AwakenerDetailOverviewProps {
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
  fontScale: FontScale
  onNavigateToCards?: () => void
}

const ENLIGHTEN_ORDER = ['E1', 'E2', 'E3'] as const
const TALENT_ORDER = ['T1', 'T2', 'T3', 'T4'] as const

function hasEnlightenEntry(fullData: AwakenerFull, key: string): boolean {
  return Object.hasOwn(fullData.enlightens, key)
}

function hasTalentEntry(fullData: AwakenerFull, key: string): boolean {
  return Object.hasOwn(fullData.talents, key)
}

export function AwakenerDetailOverview({
  awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
  fontScale,
  onNavigateToCards,
}: AwakenerDetailOverviewProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        onNavigateToCards={onNavigateToCards}
        skillLevel={skillLevel}
        stats={stats}
        text={description}
      />
    ),
    [cardNames, fullData, onNavigateToCards, skillLevel, stats],
  )

  const enlightenItems = useMemo(() => {
    if (!fullData) return []
    const items = []
    const starStyle = getStarSize(fontScale)

    for (const key of ENLIGHTEN_ORDER) {
      if (!hasEnlightenEntry(fullData, key)) continue

      const entry = fullData.enlightens[key]
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
                style={{width: starStyle.width, height: starStyle.height, top: starStyle.top}}
              />
            ))}
          </span>
        ),
        name: entry.name,
        description: entry.description,
      })
    }

    const absoluteAxiom = hasEnlightenEntry(fullData, 'AbsoluteAxiom')
      ? fullData.enlightens.AbsoluteAxiom
      : hasEnlightenEntry(fullData, 'E4')
        ? fullData.enlightens.E4
        : null

    if (absoluteAxiom) {
      items.push({
        key: 'AbsoluteAxiom',
        label: 'Е15',
        name: absoluteAxiom.name,
        description: absoluteAxiom.description,
      })
    }

    return items
  }, [fullData, fontScale])

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }
  const talentItems: DetailSectionItem[] = []
  for (const key of TALENT_ORDER) {
    if (!hasTalentEntry(fullData, key)) {
      continue
    }
    const entry = fullData.talents[key]
    talentItems.push({key, label: key, name: entry.name, description: entry.description})
  }

  const portraitRelic = getPortraitRelicByAwakenerIngameId(awakener.ingameId)
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
              <div className='h-16 w-16 shrink-0 overflow-hidden'>
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
                  {renderDescription(portraitRelic.description)}
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
