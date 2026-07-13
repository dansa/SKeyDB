import {memo, useCallback, useMemo, type MouseEvent} from 'react'

import {type AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {getMainstatByKey} from '@/domain/mainstats'

import {buildScalingEntry} from './database-popover-controller-model'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import type {DatabaseRichTextContentProps} from './DatabaseRichTextContent'
import {PopoverHeader} from './PopoverAtoms'
import {PopoverScalingGrid} from './PopoverScalingGrid'
import {PopoverContent, PopoverShell} from './PopoverShell'
import {PopoverStandardBodyContent} from './PopoverStandardBodyContent'
import {PopoverWheelBodyContent} from './PopoverWheelBodyContent'
import {
  useIsPopoverPinned,
  usePopoverActions,
  usePopoverFormulaContext,
  usePopoverReferenceLayer,
  usePopoverShowTagIcons,
  usePopoverShowVisibleScaling,
  usePopoverStats,
  type DatabasePopoverDescriptionRankContext,
} from './usePopoverStore'
import type {ResolvedPopoverVisualData} from './useResolvedPopoverVisualData'

export type {KeyedDatabaseReferenceEntry as DatabaseReferencePopoverEntry}

/**
 * Properties for the DatabaseReferencePopover component.
 */
interface DatabaseReferencePopoverProps {
  /** Resolved positioning, level progression, and content attributes for visual layout. */
  visualData: ResolvedPopoverVisualData
  /** Callback triggered when the popover close button is clicked. */
  onClose: () => void
  /** Optional callback to handle nested navigation links or nested entry clicks. */
  onInfoEntryClick?: (entry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => void
  /** Callback to trigger when an active skill reference token is clicked. */
  onSkillTokenClick: (name: string, event?: MouseEvent) => void
  /** Callback to trigger when an overlay mechanic reference token is clicked. */
  onMechanicTokenClick: (
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
    event?: MouseEvent,
  ) => void
  /** Optional callback to navigate to full records screen. */
  onNavigate?: () => void
}

const POPOVER_WIDTH_STYLE = {
  width: '100%',
  minWidth: 'inherit',
  maxWidth: 'inherit',
}

/**
 * Reference popover display shell that routes content based on the layout variant:
 * - Scaling: renders grids and levels progression.
 * - Wheel: renders specific disc illustrations and details.
 * - Standard: renders tables, links, descriptions, and related references.
 */
export const DatabaseReferencePopover = Object.assign(
  memo(function DatabaseReferencePopover({
    visualData,
    onClose,
    onInfoEntryClick,
    onSkillTokenClick,
    onMechanicTokenClick,
    onNavigate,
  }: DatabaseReferencePopoverProps) {
    const {
      isScaling,
      isWheel,
      widthClass,
      depth,
      totalDepth,
      header,
      fallbackText,
      attributeRows,
      descriptionSections,
      detailLinks,
      relatedReferences,
      wheel,
      wheelValues,
      wheelSuffix,
      scalingData,
      activeLevel,
      scalingLevelStart,
      scalingLevelLabelPrefix,
    } = visualData

    const formulaContext = usePopoverFormulaContext()
    const stats = usePopoverStats()
    const showVisibleScaling = usePopoverShowVisibleScaling()
    const showTagIcons = usePopoverShowTagIcons()
    const referenceLayer = usePopoverReferenceLayer()

    const {updatePopoverLevel, togglePin} = usePopoverActions()

    const handleLevelChange = useCallback(
      (nextLevel: number) => {
        const finalLevel = isWheel && scalingLevelStart === 0 ? nextLevel + 1 : nextLevel
        const recordId =
          visualData.entry.scalingSourceRecordId ??
          visualData.entry.record?.id ??
          visualData.entry.key
        if (recordId) {
          updatePopoverLevel(recordId, finalLevel)
        }
      },
      [
        isWheel,
        scalingLevelStart,
        visualData.entry.scalingSourceRecordId,
        visualData.entry.record?.id,
        visualData.entry.key,
        updatePopoverLevel,
      ],
    )

    const handleMainstatClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
        if (!isWheel || !wheel || wheelValues.length === 0) {
          return
        }

        const mainstatLabel = getMainstatByKey(wheel.mainstatKey)?.label ?? wheel.mainstatKey
        const finalLevelStart = 0
        const finalLevelLabelPrefix = 'E'
        const finalCurrentLevel = Math.max(3, visualData.entry.scalingCurrentLevel ?? 0)
        onInfoEntryClick?.(
          buildScalingEntry({
            values: wheelValues,
            suffix: wheelSuffix,
            stat: mainstatLabel,
            currentLevel: finalCurrentLevel - 1,
            levelStart: finalLevelStart,
            levelLabelPrefix: finalLevelLabelPrefix,
            lastDatabaseRank: activeLevel,
            sourceRecordId: wheel.id,
            descriptionRankMode: visualData.entry.descriptionRankMode,
          }),
          e,
        )
      },
      [
        isWheel,
        wheel,
        wheelValues,
        wheelSuffix,
        onInfoEntryClick,
        visualData.entry.scalingCurrentLevel,
        activeLevel,
        visualData.entry.descriptionRankMode,
      ],
    )

    const contentProps = useMemo<DatabaseRichTextContentProps>(
      () => ({
        text: visualData.entry.description,
        record: visualData.entry.record,
        keywordFooterText: visualData.entry.keywordFooterText,
        descriptionRank: activeLevel,
        descriptionMaxRank: visualData.entry.descriptionMaxRank,
        formulaContext: formulaContext ?? undefined,
        referenceLayer,
        showVisibleScaling,
        showTagIcons,
        skillLevel: activeLevel,
        stats,
        variant: 'popover',
        onMechanicClick: (overlay, event) => {
          onMechanicTokenClick(
            overlay,
            {
              descriptionRank: visualData.entry.descriptionRank,
              descriptionMaxRank: visualData.entry.descriptionMaxRank,
              descriptionRankMode: visualData.entry.descriptionRankMode,
            },
            event,
          )
        },
        onSkillClick: onSkillTokenClick,
        onScalingClick: (
          values,
          suffix,
          stat,
          event,
          formulas,
          currentLevel,
          finalValues,
          abstractFormula,
          arg,
          sourceRecordId,
          sourceArgKey,
        ) => {
          onInfoEntryClick?.(
            buildScalingEntry({
              values,
              suffix,
              stat,
              formulas,
              currentLevel,
              lastDatabaseRank: activeLevel,
              finalValues,
              abstractFormula,
              arg,
              sourceRecordId,
              sourceArgKey,
              descriptionRankMode: visualData.entry.descriptionRankMode,
            }),
            event,
          )
        },
      }),
      [
        visualData.entry,
        activeLevel,
        onMechanicTokenClick,
        onSkillTokenClick,
        onInfoEntryClick,
        formulaContext,
        referenceLayer,
        showVisibleScaling,
        showTagIcons,
        stats,
      ],
    )

    const handleTogglePin = useCallback(
      (e?: React.MouseEvent) => {
        e?.stopPropagation()
        const popoverElement = e?.currentTarget.closest('[data-popover-id]')
        const rect = popoverElement?.getBoundingClientRect()
        togglePin(visualData.key, rect)
      },
      [visualData.key, togglePin],
    )

    const isPinned = useIsPopoverPinned(visualData.key)

    return (
      <PopoverShell
        className={widthClass}
        depth={depth}
        header={header ?? undefined}
        hideHeader={isWheel}
        onClose={onClose}
        style={POPOVER_WIDTH_STYLE}
        totalDepth={totalDepth}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
      >
        {isScaling ? (
          <PopoverContent style={{overflowY: 'hidden'}}>
            <PopoverScalingGrid
              currentLevel={activeLevel}
              levelLabelPrefix={scalingLevelLabelPrefix}
              levelStart={scalingLevelStart}
              stat={visualData.entry.scalingStat ?? null}
              stats={stats}
              suffix={visualData.entry.scalingSuffix ?? ''}
              values={scalingData.originalValues}
              scalingFormulas={scalingData.liveFormulas}
              scalingFinalValues={scalingData.liveFinalValues}
              scalingAbstractFormula={scalingData.liveAbstractFormula}
              scalingAbstractFormulaExplanations={scalingData.liveAbstractFormulaExplanations}
              onOpenReferenceName={onSkillTokenClick}
              shouldCeil={scalingData.shouldCeil}
              showVisibleScaling={showVisibleScaling}
              onLevelChange={handleLevelChange}
            />
          </PopoverContent>
        ) : isWheel ? (
          <PopoverWheelBodyContent
            wheel={wheel}
            entry={visualData.entry}
            isDraggable={true}
            isPinned={isPinned}
            onTogglePin={handleTogglePin}
            onClose={onClose}
            onNavigate={onNavigate}
            attributeRows={attributeRows}
            onMainstatClick={handleMainstatClick}
            contentProps={contentProps}
            fallbackText={fallbackText}
          />
        ) : (
          <PopoverContent className='mt-1'>
            <PopoverStandardBodyContent
              attributeRows={attributeRows}
              contentProps={contentProps}
              descriptionSections={descriptionSections}
              detailLinks={detailLinks}
              entry={visualData.entry}
              fallbackText={fallbackText}
              formulaContext={formulaContext ?? undefined}
              onInfoEntryClick={onInfoEntryClick}
              onSkillTokenClick={onSkillTokenClick}
              relatedReferences={relatedReferences}
              stats={stats}
            />
          </PopoverContent>
        )}
      </PopoverShell>
    )
  }),
  {
    Shell: PopoverShell,
    Header: PopoverHeader,
    StandardBody: PopoverStandardBodyContent,
    ScalingGrid: PopoverScalingGrid,
    WheelBody: PopoverWheelBodyContent,
  },
)
