import { useCallback } from 'react'
import type { AwakenerFull, AwakenerFullStats } from '../../domain/awakeners-full'
import { DetailSection } from './DetailSection'
import { scaledFontStyle } from './font-scale'
import { RichDescription } from './RichDescription'
import {
  DATABASE_ITEM_NAME_CLASS,
  DATABASE_SECTION_TITLE_CLASS,
} from './text-styles'

type AwakenerDetailCardsProps = {
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  cardNames: Set<string>
  skillLevel: number
}

const CARD_KEYS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'] as const

export function AwakenerDetailCards({
  fullData,
  stats,
  cardNames,
  skillLevel,
}: AwakenerDetailCardsProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        skillLevel={skillLevel}
        stats={stats}
        text={description}
      />
    ),
    [cardNames, fullData, skillLevel, stats],
  )

  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading card data...</p>
  }

  const { exalt, over_exalt } = fullData.exalts
  const exaltItems = [
    { key: 'exalt', label: 'Exalt', name: exalt.name, description: exalt.description },
    { key: 'over_exalt', label: 'Over Exalt', name: over_exalt.name, description: over_exalt.description },
  ]

  const cardEntries: { key: string; card: { name: string; cost: string; description: string } }[] = []
  for (const key of CARD_KEYS) {
    const card = fullData.cards[key]
    if (card) cardEntries.push({ key, card })
  }

  return (
    <div className="space-y-4">
      <DetailSection items={exaltItems} renderDescription={renderDescription} title="Exalts" />

      <div className="border border-slate-600/30 bg-slate-900/30">
        <h4
          className={DATABASE_SECTION_TITLE_CLASS}
          style={scaledFontStyle(14)}
        >Command Cards</h4>
        <div>
          {cardEntries.map(({ key, card }, index) => (
            <div key={key}>
              {index > 0 ? (
                <div className="mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent" />
              ) : null}
              <div className="px-4 py-2.5">
                <div className="flex items-baseline justify-between">
                  <p
                    className="text-slate-300"
                    style={scaledFontStyle(12)}
                  >
                    <span className="text-slate-500">{key === 'C1' ? 'Rouse' : key}</span>
                    <span className="mx-1.5 text-slate-600">·</span>
                    <span className={DATABASE_ITEM_NAME_CLASS}>{card.name}</span>
                  </p>
                  <span
                    className="text-slate-500"
                    style={scaledFontStyle(10)}
                  >Cost {card.cost}</span>
                </div>
                <p
                  className="mt-1 leading-relaxed text-slate-400"
                  style={scaledFontStyle(12)}
                >
                  {renderDescription(card.description)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
