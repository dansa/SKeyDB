import { useCallback } from 'react'
import type { AwakenerFull } from '../../domain/awakeners-full'
import { DetailSection, type DetailSectionItem } from './DetailSection'
import { RichDescription } from './RichDescription'

type AwakenerDetailOverviewProps = {
  fullData: AwakenerFull | null
  cardNames: Set<string>
  skillLevel: number
  onNavigateToCards?: () => void
}

const ENLIGHTEN_ORDER = ['E1', 'E2', 'E3'] as const
const TALENT_ORDER = ['T1', 'T2', 'T3'] as const

export function AwakenerDetailOverview({ fullData, cardNames, skillLevel, onNavigateToCards }: AwakenerDetailOverviewProps) {
  const renderDescription = useCallback(
    (description: string) => (
      <RichDescription
        cardNames={cardNames}
        fullData={fullData}
        onNavigateToCards={onNavigateToCards}
        skillLevel={skillLevel}
        text={description}
      />
    ),
    [cardNames, fullData, skillLevel, onNavigateToCards],
  )

  if (!fullData) {
    return <p className="py-4 text-xs text-slate-400">Loading...</p>
  }

  const enlightenItems: DetailSectionItem[] = []
  for (const key of ENLIGHTEN_ORDER) {
    const entry = fullData.enlightens[key]
    if (entry) enlightenItems.push({ key, label: key, name: entry.name, description: entry.description })
  }
  const absoluteAxiom = fullData.enlightens['AbsoluteAxiom'] ?? fullData.enlightens['E4']
  if (absoluteAxiom) {
    enlightenItems.push({
      key: 'AbsoluteAxiom',
      label: 'Absolute Axiom (+12)',
      name: absoluteAxiom.name,
      description: absoluteAxiom.description,
    })
  }

  const talentItems: DetailSectionItem[] = []
  for (const key of TALENT_ORDER) {
    const entry = fullData.talents[key]
    if (entry) talentItems.push({ key, label: key, name: entry.name, description: entry.description })
  }

  return (
    <div className="space-y-4">
      <DetailSection
        emptyMessage="No enlighten data available."
        items={enlightenItems}
        renderDescription={renderDescription}
        title="Enlightens"
      />
      <DetailSection
        emptyMessage="No talent data available."
        items={talentItems}
        renderDescription={renderDescription}
        title="Talents"
      />
    </div>
  )
}
