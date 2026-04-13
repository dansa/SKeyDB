import {useCallback, useMemo} from 'react'

import enlightensStars from '@/assets/icons/Battle_Card_Buff_045.png'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerEnlighten, AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {RichDescription} from '@/pages/database/components/RichText/RichDescription'
import {getStarSize, type FontScale} from '@/pages/database/utils/font-scale'

import {DetailSection, type DetailSectionItem} from './DetailSection'

type AwakenerDetailOverviewProps = Readonly<{
  awakener: Awakener
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
  fontScale: FontScale
  onNavigateToCards?: () => void
  mode: 'copies' | 'talents'
  realmTint?: string
}>

function buildStarKeys(prefix: string, count: number): string[] {
  const keys: string[] = []
  for (let starNumber = 1; starNumber <= count; starNumber += 1) {
    keys.push(`${prefix}-star-${String(starNumber)}`)
  }
  return keys
}

export function AwakenerDetailOverview({
  awakener: _awakener,
  fullData,
  stats,
  cardNames,
  skillLevel,
  fontScale,
  onNavigateToCards,
  mode,
  realmTint,
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
    if (!fullData || mode !== 'copies') return []
    const items: DetailSectionItem[] = []
    const starStyle = getStarSize(fontScale)

    const enlightenKeys = Object.keys(fullData.enlightens)
      .filter((key) => key.startsWith('E') && key !== 'E15')
      .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))

    for (const key of enlightenKeys) {
      const entry = fullData.enlightens[key]
      const starCountMatch = /\d+/.exec(key)
      const starCount = starCountMatch ? Number.parseInt(starCountMatch[0], 10) : 0
      const starKeys = buildStarKeys(key, starCount)

      items.push({
        key,
        label: entry.label ?? (
          <span className={`relative inline-flex h-[1em] items-center ${starStyle.space}`}>
            {starKeys.map((starKey, index) => (
              <img
                key={starKey}
                src={enlightensStars}
                alt={`E${String(index + 1)}`}
                className='relative'
                style={{width: starStyle.width, height: starStyle.height}}
              />
            ))}
          </span>
        ),
        name: entry.name,
        description: entry.description,
      })
    }

    const absoluteAxiom = (fullData.enlightens as Record<string, unknown>).E15 as
      | AwakenerEnlighten
      | undefined

    if (absoluteAxiom) {
      items.push({
        key: 'E15',
        label: absoluteAxiom.label ?? 'Е15',
        name: absoluteAxiom.name,
        description: absoluteAxiom.description,
      })
    }

    return items
  }, [fontScale, fullData, mode])

  if (!fullData) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }

  const talentItems: DetailSectionItem[] = []
  if (mode === 'talents') {
    const talentKeys = Object.keys(fullData.talents)
      .filter((key) => key.startsWith('T'))
      .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}))

    for (const key of talentKeys) {
      const entry = fullData.talents[key]
      talentItems.push({
        key,
        label: entry.label ?? key,
        name: entry.name,
        description: entry.description,
      })
    }
  }

  return (
    <div className='space-y-4'>
      {mode === 'copies' && (
        <DetailSection
          emptyMessage='No enlighten data available.'
          items={enlightenItems}
          renderDescription={renderDescription}
          realmTint={realmTint}
          title='Enlightens'
        />
      )}
      {mode === 'talents' && (
        <DetailSection
          emptyMessage='No talent data available.'
          items={talentItems}
          renderDescription={renderDescription}
          realmTint={realmTint}
          title='Talents'
        />
      )}
    </div>
  )
}
