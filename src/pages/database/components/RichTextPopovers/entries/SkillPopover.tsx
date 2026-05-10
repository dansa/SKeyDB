import {memo, useCallback, useMemo} from 'react'

import type {AwakenerFullStats} from '@/domain/awakeners-full'
import {nextRichSegmentKey} from '@/pages/database/components/RichText/rich-segment-keys'
import {memoizedParseRichDescription} from '@/pages/database/components/RichText/rich-text-cache'
import {getDatabaseSkillNameColor} from '@/pages/database/utils/text-styles'

import {RichSegmentRenderer} from '../../RichText/RichSegmentRenderer'
import {ExpandableContent} from '../core/ExpandableContent'
import type {PopoverHeaderModel} from '../core/popover-header-model'
import {type TokenNavigationRequest} from '../core/popover-navigation'
import {PopoverContent, PopoverShell} from '../core/PopoverShell'
import {SkillHeaderIcon, SkillHeaderValue, type SkillType} from './SkillHeaderEyebrow'

type SkillPopoverProps = Readonly<{
  name: string
  label: string
  description: string
  cardNames: Set<string>
  stats: AwakenerFullStats | null
  onClose: () => void
  onTokenNavigate: (request: TokenNavigationRequest) => void
  onNavigateToCards?: (targetName?: string) => void
  skillLevel: number
  cost?: string
  skillType?: SkillType
  depth?: number
  totalDepth?: number
  onBack?: () => void
}>

export const SkillPopover = memo(function SkillPopover({
  name,
  label,
  description,
  cardNames,
  stats,
  onClose,
  onTokenNavigate,
  onNavigateToCards,
  skillLevel,
  cost,
  skillType,
  depth,
  totalDepth,
  onBack,
}: SkillPopoverProps) {
  const segments = useMemo(
    () => memoizedParseRichDescription(description, cardNames),
    [description, cardNames],
  )

  const isExalt = skillType === 'exalt'
  const isRouse = label.toLowerCase() === 'rouse' || name.toLowerCase() === 'rouse'
  const skillNameColor = getDatabaseSkillNameColor({
    skillType,
    isOverExalt: isExalt && name.toLowerCase().includes('over'),
    isRouse,
  })

  const segmentKeyCounts = new Map<string, number>()

  const handleNavigateToCards = useCallback(() => {
    onClose()
    onNavigateToCards?.(name)
  }, [name, onClose, onNavigateToCards])

  const headerContent = (
    <span className='flex min-w-0 items-center gap-1.5 overflow-hidden'>
      <SkillHeaderIcon isInteractive={!!onNavigateToCards} name={name} skillType={skillType} />
      <span className='flex min-w-0 items-baseline gap-2 overflow-hidden transition-colors'>
        <SkillHeaderValue
          cost={cost}
          isInteractive={!!onNavigateToCards}
          label={label}
          name={name}
          skillType={skillType}
          stats={stats}
        />
        <span className='mx-0.5 h-[1em] w-px shrink-0 translate-y-[0.15em] bg-white/10' />
        <span
          className={`min-w-0 overflow-hidden text-ellipsis whitespace-nowrap transition-colors ${
            onNavigateToCards ? 'group-hover:!text-amber-100' : ''
          }`}
          style={{
            color: skillNameColor,
          }}
        >
          {name}
        </span>

        <span
          className={`flex shrink-0 items-center overflow-hidden transition-all duration-300 ease-in-out ${
            onNavigateToCards ? 'max-w-[1.2em] opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <span className='ml-1 text-slate-600 transition-colors group-hover:text-amber-300'>
            &#8599;
          </span>
        </span>
      </span>
    </span>
  )

  const header: PopoverHeaderModel = {
    title: (
      <button
        className={`group flex w-fit min-w-0 items-center text-left transition-all ${
          onNavigateToCards ? 'cursor-pointer' : 'cursor-default'
        }`}
        disabled={!onNavigateToCards}
        onClick={handleNavigateToCards}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          fontWeight: 'inherit',
          letterSpacing: 'inherit',
          lineHeight: 'inherit',
        }}
        title={onNavigateToCards ? 'View in Skills tab' : undefined}
        type='button'
      >
        {headerContent}
      </button>
    ),
  }

  return (
    <PopoverShell
      className='max-w-[560px] min-w-[280px]'
      depth={depth}
      header={header}
      onBack={onBack}
      onClose={onClose}
      totalDepth={totalDepth}
    >
      <PopoverContent className='mt-1.5'>
        <ExpandableContent>
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
        </ExpandableContent>
      </PopoverContent>
    </PopoverShell>
  )
})
