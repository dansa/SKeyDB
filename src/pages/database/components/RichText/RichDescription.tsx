import {useCallback, useMemo} from 'react'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {type RichSegment} from '@/domain/rich-text'

import {type TokenNavigationRequest} from '../RichTextPopovers/core/popover-navigation'
import {hasRouseRichDescriptionCard} from './rich-description-entries'
import {nextRichSegmentKey} from './rich-segment-keys'
import {memoizedParseRichDescription} from './rich-text-cache'
import {RichSegmentRenderer} from './RichSegmentRenderer'
import {useRichDescriptionTrail} from './useRichDescriptionTrail'

type RichDescriptionProps = Readonly<{
  text: string
  cardNames: Set<string>
  fullData: AwakenerFull | null
  stats: AwakenerFullStats | null
  skillLevel: number
  onNavigateToCards?: (targetName?: string) => void
}>

export function RichDescription({
  text,
  cardNames,
  fullData,
  stats,
  skillLevel,
  onNavigateToCards,
}: RichDescriptionProps) {
  const rouseAwareCards = useMemo(() => {
    const names = new Set(cardNames)
    if (fullData) {
      if (hasRouseRichDescriptionCard(fullData) && !names.has('Rouse')) {
        names.add('Rouse')
      }
      names.add('exalt')
      names.add('over_exalt')
    }
    return names
  }, [cardNames, fullData])

  const segments: RichSegment[] = memoizedParseRichDescription(text, rouseAwareCards)
  const {openSkillTrail, openTagTrail, openScalingTrail} = useRichDescriptionTrail(
    fullData,
    rouseAwareCards,
    stats,
    skillLevel,
    onNavigateToCards,
  )

  const handleRootTokenNavigate = useCallback(
    (request: TokenNavigationRequest) => {
      switch (request.kind) {
        case 'skill':
          openSkillTrail(request.name, request.anchorElement)
          return
        case 'tag':
          openTagTrail(request.tag, request.anchorElement)
          return
        case 'scaling':
          openScalingTrail(request.values, request.suffix, request.stat, request.anchorElement)
      }
    },
    [openScalingTrail, openSkillTrail, openTagTrail],
  )

  const renderedSegments = renderRichDescriptionSegments(
    segments,
    handleRootTokenNavigate,
    skillLevel,
    stats,
  )

  return <>{renderedSegments}</>
}

function renderRichDescriptionSegments(
  segments: RichSegment[],
  onTokenNavigate: (request: TokenNavigationRequest) => void,
  skillLevel: number,
  stats: AwakenerFullStats | null,
) {
  const keyCounts = new Map<string, number>()
  return segments.map((segment: RichSegment) => {
    const key = nextRichSegmentKey(keyCounts, segment)
    return (
      <RichSegmentRenderer
        key={key}
        onTokenNavigate={onTokenNavigate}
        segment={segment}
        skillLevel={skillLevel}
        stats={stats}
        variant='inline'
      />
    )
  })
}
