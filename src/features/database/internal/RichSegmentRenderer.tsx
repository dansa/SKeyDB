import type {AwakenerOverlayRecord, FullStats} from '@/domain/awakener-source-schema'
import type {PublicDescriptionArg} from '@/domain/public-description-args'
import type {PublicFormulaContext} from '@/domain/public-formula-context'
import type {RichSegment} from '@/domain/rich-text'

import {DatabaseLoreMarkupText} from './DatabaseLoreMarkupText'
import {
  RichDescriptionArgPluralSegment,
  RichDescriptionArgSegment,
} from './RichDescriptionArgSegment'
import {RichScalingSegment} from './RichScalingSegment'
import {MechanicToken, RealmToken, SkillToken, type ActivationEvent} from './RichSegmentTokens'
import {
  DATABASE_POPOVER_STAT_TOKEN_CLASS,
  DATABASE_REFERENCE_TOKEN_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
} from './text-styles'

export type RichSegmentRendererVariant = 'inline' | 'popover'
export type {ActivationEvent}

interface RichSegmentRendererProps {
  segment: RichSegment
  variant: RichSegmentRendererVariant
  skillLevel: number
  stats: FullStats | null
  showVisibleScaling?: boolean
  showTagIcons?: boolean
  descriptionArgs?: Record<string, PublicDescriptionArg>
  formulaContext?: PublicFormulaContext
  descriptionRank?: number
  descriptionMaxRank?: number
  overlays?: readonly AwakenerOverlayRecord[]
  overlayByName?: ReadonlyMap<string, AwakenerOverlayRecord>
  onSkillClick?: (name: string, event: ActivationEvent) => void
  onMechanicClick?: (overlay: AwakenerOverlayRecord, event: ActivationEvent) => void
}

export function RichSegmentRenderer({
  segment,
  variant,
  skillLevel,
  stats,
  showVisibleScaling = true,
  showTagIcons = true,
  descriptionArgs,
  formulaContext,
  descriptionRank,
  descriptionMaxRank,
  overlays,
  overlayByName,
  onSkillClick,
  onMechanicClick,
}: RichSegmentRendererProps) {
  switch (segment.type) {
    case 'text':
      return <DatabaseLoreMarkupText text={segment.value} />

    case 'skill':
      return <SkillToken name={segment.name} onSkillClick={onSkillClick} />

    case 'reference':
      return <span className={DATABASE_REFERENCE_TOKEN_CLASS}>{segment.name}</span>

    case 'stat':
      return (
        <span
          className={
            variant === 'popover' ? DATABASE_POPOVER_STAT_TOKEN_CLASS : DATABASE_STAT_TOKEN_CLASS
          }
        >
          {segment.name}
        </span>
      )

    case 'mechanic': {
      return (
        <MechanicToken
          name={segment.name}
          overlayByName={overlayByName}
          overlays={overlays}
          showTagIcons={showTagIcons}
          onMechanicClick={onMechanicClick}
        />
      )
    }

    case 'realm': {
      return (
        <RealmToken
          name={segment.name}
          overlayByName={overlayByName}
          overlays={overlays}
          onMechanicClick={onMechanicClick}
        />
      )
    }

    case 'scaling':
      return (
        <RichScalingSegment
          segment={segment}
          showVisibleScaling={showVisibleScaling}
          skillLevel={skillLevel}
          stats={stats}
          variant={variant}
        />
      )

    case 'descriptionArg': {
      const arg = descriptionArgs?.[segment.argKey]
      if (!arg) {
        return <>{`[${segment.channel ? `${segment.channel}:` : ''}${segment.argKey}]`}</>
      }

      return (
        <RichDescriptionArgSegment
          arg={arg}
          channel={segment.channel}
          formulaContext={formulaContext}
          maxRank={descriptionMaxRank}
          rank={descriptionRank ?? skillLevel}
          showVisibleScaling={showVisibleScaling}
          stats={stats}
          variant={variant}
        />
      )
    }

    case 'argPlural': {
      const arg = descriptionArgs?.[segment.argKey]
      if (!arg) {
        return <>{segment.plural}</>
      }

      return (
        <RichDescriptionArgPluralSegment
          arg={arg}
          formulaContext={formulaContext}
          rank={descriptionRank ?? skillLevel}
          singular={segment.singular}
          plural={segment.plural}
          stats={stats}
        />
      )
    }
  }
}
