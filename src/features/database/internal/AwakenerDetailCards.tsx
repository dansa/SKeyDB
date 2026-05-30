import {useMemo, type ReactNode} from 'react'

import type {
  AwakenerEnlightenRecord,
  AwakenerSkillRecord,
  DerivedSkillRecord,
} from '@/domain/awakener-source-schema'
import {
  type DatabaseDescribedEntry,
  type ResolvedAwakenerDatabaseShellView,
} from '@/domain/awakeners-database-view'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'

import {AwakenerEnlightenInfluenceBadges} from './AwakenerEnlightenInfluenceBadges'
import {
  DATABASE_DETAIL_BODY_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailBodyTextStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import {useDatabasePopoverControllerContext} from './database-popover-context'
import {DatabaseScopedRichDescription} from './DatabaseScopedRichDescription'
import {
  DATABASE_ITEM_NAME_CLASS,
  DATABASE_SECTION_TITLE_CLASS,
  DATABASE_STAT_TOKEN_CLASS,
} from './text-styles'

interface AwakenerDetailCardsProps {
  shellView: ResolvedAwakenerDatabaseShellView | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

type CardDescriptionItem = Pick<
  DatabaseDescribedEntry<AwakenerSkillRecord | DerivedSkillRecord>,
  'resolved'
> & {
  description?: string
  descriptionMaxRank?: number
  descriptionRank?: number
  keywordFooterText?: string
  record?: Parameters<typeof DatabaseScopedRichDescription>[0]['record']
}

type CardCostKind = Parameters<typeof getCardDisplayCost>[1]

interface CardSectionMeta {
  key: string
  label: ReactNode
  costKind: CardCostKind
}

function AwakenerCardDescription({
  formulaContext,
  item,
  referenceLayer,
  showTagIcons,
  showVisibleScaling,
  skillLevel,
  stats,
}: {
  formulaContext: ResolvedAwakenerDatabaseShellView['formulaContext']
  item: CardDescriptionItem
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  showTagIcons: boolean
  showVisibleScaling: boolean
  skillLevel: number
  stats: ResolvedAwakenerDatabaseShellView['stats'] | null
}) {
  return (
    <DatabaseScopedRichDescription
      descriptionMaxRank={item.descriptionMaxRank}
      descriptionRank={item.descriptionRank}
      formulaContext={formulaContext}
      keywordFooterText={item.keywordFooterText}
      record={item.record}
      referenceLayer={referenceLayer}
      showTagIcons={showTagIcons}
      showVisibleScaling={showVisibleScaling}
      skillLevel={skillLevel}
      stats={stats}
      text={item.description ?? item.resolved.description}
    />
  )
}

function AwakenerCardSection<TRecord extends AwakenerSkillRecord | DerivedSkillRecord>({
  entries,
  exaltBaseCost,
  formulaContext,
  getEntryMeta,
  onToggleEnlightenSlot,
  referenceLayer,
  selectedEnlightenSlot,
  showTagIcons,
  showVisibleScaling,
  skillLevel,
  stats,
  title,
}: {
  entries: DatabaseDescribedEntry<TRecord>[]
  exaltBaseCost: string | undefined
  formulaContext: ResolvedAwakenerDatabaseShellView['formulaContext']
  getEntryMeta: (entry: DatabaseDescribedEntry<TRecord>) => CardSectionMeta
  onToggleEnlightenSlot: AwakenerDetailCardsProps['onToggleEnlightenSlot']
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: ResolvedAwakenerDatabaseShellView['selection']['selectedEnlightenSlot']
  showTagIcons: boolean
  showVisibleScaling: boolean
  skillLevel: number
  stats: ResolvedAwakenerDatabaseShellView['stats'] | null
  title: string
}) {
  return (
    <div className='border border-slate-600/30 bg-slate-900/30'>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={getDatabaseDetailSectionHeadingStyle()}>
        {title}
      </h4>
      <div>
        {entries.map((entry, index) => {
          const meta = getEntryMeta(entry)

          return (
            <div key={meta.key}>
              {index > 0 ? (
                <div className='mx-4 h-px bg-gradient-to-r from-slate-600/50 via-slate-600/20 to-transparent' />
              ) : null}
              <div className='px-4 py-2.5'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 text-slate-300' data-card-header=''>
                    <p className={DATABASE_ITEM_NAME_CLASS}>{entry.record.displayName}</p>
                    <div
                      className='mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-slate-500'
                      style={getDatabaseDetailBodyTextStyle()}
                    >
                      {meta.label}
                      <span className='text-slate-600'>·</span>
                      <span className={`${DATABASE_STAT_TOKEN_CLASS} whitespace-nowrap`}>
                        Cost {getCardDisplayCost(entry.record.cost, meta.costKind, exaltBaseCost)}
                      </span>
                    </div>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <AwakenerEnlightenInfluenceBadges
                      align='end'
                      influenceBadges={entry.influenceBadges ?? []}
                      openMode='root'
                      onToggleEnlightenSlot={onToggleEnlightenSlot}
                      selectedEnlightenSlot={selectedEnlightenSlot}
                    />
                  </div>
                </div>
                <p
                  className={`mt-1 ${DATABASE_DETAIL_BODY_CLASS}`}
                  style={getDatabaseDetailBodyStyle()}
                >
                  <AwakenerCardDescription
                    formulaContext={formulaContext}
                    item={entry}
                    referenceLayer={referenceLayer}
                    showTagIcons={showTagIcons}
                    showVisibleScaling={showVisibleScaling}
                    skillLevel={skillLevel}
                    stats={stats}
                  />
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AwakenerDetailCards({
  shellView,
  referenceLayer,
  onToggleEnlightenSlot,
  showVisibleScaling = true,
  showTagIcons = true,
}: AwakenerDetailCardsProps) {
  const popoverController = useDatabasePopoverControllerContext()

  const exaltBaseCost = useMemo(
    () => shellView?.exalts.find((entry) => entry.key === 'Exalt')?.record.cost,
    [shellView],
  )

  if (!shellView) {
    return <p className='py-4 text-xs text-slate-400'>Loading card data…</p>
  }

  const view = shellView

  return (
    <>
      <div className='space-y-4'>
        <AwakenerCardSection
          entries={shellView.exalts}
          exaltBaseCost={exaltBaseCost}
          formulaContext={shellView.formulaContext}
          getEntryMeta={(entry) => ({
            key: entry.key.toLowerCase(),
            label:
              entry.key === 'OverExalt' && popoverController ? (
                <button
                  className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
                  onClick={(event) => {
                    popoverController.openRootReferenceByName('Over Exalt', event)
                  }}
                  style={getDatabaseDetailBodyTextStyle()}
                  type='button'
                >
                  Over Exalt
                </button>
              ) : (
                <span>{entry.key === 'OverExalt' ? 'Over Exalt' : 'Exalt'}</span>
              ),
            costKind: entry.record.kind,
          })}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={referenceLayer}
          selectedEnlightenSlot={view.selection.selectedEnlightenSlot}
          showTagIcons={showTagIcons}
          showVisibleScaling={showVisibleScaling}
          skillLevel={shellView.skillLevel}
          stats={shellView.stats}
          title='Exalts'
        />

        <AwakenerCardSection
          entries={shellView.commandCards}
          exaltBaseCost={exaltBaseCost}
          formulaContext={shellView.formulaContext}
          getEntryMeta={(entry) => ({
            key: entry.key,
            label:
              entry.key === 'C1' && popoverController ? (
                <button
                  className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
                  onClick={(event) => {
                    popoverController.openRootReferenceByName('Rouse', event)
                  }}
                  style={getDatabaseDetailBodyTextStyle()}
                  type='button'
                >
                  Rouse
                </button>
              ) : (
                <span>{entry.key === 'C1' ? 'Rouse' : entry.key}</span>
              ),
            costKind: entry.record.kind,
          })}
          onToggleEnlightenSlot={onToggleEnlightenSlot}
          referenceLayer={referenceLayer}
          selectedEnlightenSlot={view.selection.selectedEnlightenSlot}
          showTagIcons={showTagIcons}
          showVisibleScaling={showVisibleScaling}
          skillLevel={shellView.skillLevel}
          stats={shellView.stats}
          title='Command Cards'
        />

        {shellView.promotedExtras.length > 0 ? (
          <AwakenerCardSection
            entries={shellView.promotedExtras}
            exaltBaseCost={exaltBaseCost}
            formulaContext={shellView.formulaContext}
            getEntryMeta={(entry) => ({
              key: entry.record.id,
              label: <span>Derived</span>,
              costKind: 'other',
            })}
            onToggleEnlightenSlot={onToggleEnlightenSlot}
            referenceLayer={referenceLayer}
            selectedEnlightenSlot={view.selection.selectedEnlightenSlot}
            showTagIcons={showTagIcons}
            showVisibleScaling={showVisibleScaling}
            skillLevel={shellView.skillLevel}
            stats={shellView.stats}
            title='Derived Cards'
          />
        ) : null}
      </div>
    </>
  )
}

function getCardDisplayCost(
  cost: string | undefined,
  kind: 'strike' | 'defense' | 'command' | 'rouse' | 'exalt' | 'over_exalt' | 'other',
  exaltCost?: string,
) {
  if (typeof cost === 'string' && cost.trim()) {
    return cost
  }

  if (kind === 'strike' || kind === 'defense') {
    return '1'
  }

  if (kind === 'over_exalt' && typeof exaltCost === 'string' && /^\d+$/.test(exaltCost.trim())) {
    return String(Number(exaltCost.trim()) * 2)
  }

  return '—'
}
