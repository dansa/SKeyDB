import {memo, useMemo} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {getTagColor, getTagIcon, type Tag} from '@/domain/tags'

import {nextRichSegmentKey} from '../../RichText/rich-segment-keys'
import {memoizedParseRichDescription} from '../../RichText/rich-text-cache'
import {RichSegmentRenderer} from '../../RichText/RichSegmentRenderer'
import type {PopoverHeaderModel} from '../core/popover-header-model'
import {type TokenNavigationRequest} from '../core/popover-navigation'
import {PopoverContent, PopoverShell} from '../core/PopoverShell'

type TagPopoverProps = Readonly<{
  tag: Tag
  cardNames: Set<string>
  onClose: () => void
  onTokenNavigate: (request: TokenNavigationRequest) => void
  skillLevel: number
  stats: AwakenerFullStats | null
  depth?: number
  totalDepth?: number
  onBack?: () => void
}>

export const TagPopover = memo(function TagPopover({
  tag,
  cardNames,
  onClose,
  onTokenNavigate,
  skillLevel,
  stats,
  depth,
  totalDepth,
  onBack,
}: TagPopoverProps) {
  const segments = useMemo(
    () => memoizedParseRichDescription(tag.description, cardNames),
    [tag.description, cardNames],
  )
  const color = getTagColor(tag)
  const icon = tag.iconId && getTagIcon(tag.iconId) ? getTagIcon(tag.iconId) : null
  const segmentKeyCounts = new Map<string, number>()
  const header: PopoverHeaderModel = {
    icon: icon ? (
      <img alt='' className='h-[1.1em] w-auto shrink-0 translate-y-px' src={icon} />
    ) : undefined,
    title: tag.label,
    titleClassName: 'pt-0.5 font-semibold tracking-wide',
    titleStyle: {
      color: color ?? undefined,
    },
  }

  return (
    <PopoverShell
      className='max-w-[340px] min-w-[240px]'
      depth={depth}
      header={header}
      onBack={onBack}
      onClose={onClose}
      totalDepth={totalDepth}
    >
      <PopoverContent className='mt-1.5'>
        {segments.map((segment) => (
          <RichSegmentRenderer
            key={nextRichSegmentKey(segmentKeyCounts, segment)}
            onTokenNavigate={onTokenNavigate}
            segment={segment}
            skillLevel={skillLevel}
            stats={stats}
            variant='popover'
          />
        ))}
      </PopoverContent>
    </PopoverShell>
  )
})
