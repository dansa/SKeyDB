import {useEffect, useMemo, type ReactNode} from 'react'

import costIcon from '@/assets/icons/UI_Battel_White_Buff_094.png'
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
import {getColoredMainstatIcon} from '@/domain/mainstats'

import {AwakenerEnlightenInfluenceBadges} from './AwakenerEnlightenInfluenceBadges'
import {
  DATABASE_DETAIL_BODY_CLASS,
  getDatabaseDetailBodyTextStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabaseScopedRichDescription} from './DatabaseScopedRichDescription'
import {
  DATABASE_ITEM_NAME_CLASS,
  DATABASE_SECTION_TITLE_CLASS,
  getDatabaseSkillNameColor,
} from './text-styles'
import {usePopoverStore} from './usePopoverStore'

interface AwakenerDetailCardsProps {
  shellView: ResolvedAwakenerDatabaseShellView | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling?: boolean
  showTagIcons?: boolean
  highlightedSkillId?: string | null
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
  highlightedSkillId,
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
  highlightedSkillId?: string | null
}) {
  const openRootInfo = usePopoverStore((state) => state.openRootInfo)
  const aliemusIcon = getColoredMainstatIcon('ALIEMUS_REGEN')
  return (
    <div>
      <h4 className={DATABASE_SECTION_TITLE_CLASS} style={getDatabaseDetailSectionHeadingStyle()}>
        {title}
      </h4>
      <div className='flex flex-col gap-y-3 pt-0 pb-2'>
        {entries.map((entry) => {
          const meta = getEntryMeta(entry)
          const isExalt =
            meta.costKind === 'exalt' ||
            meta.costKind === 'over_exalt' ||
            entry.key === 'Exalt' ||
            entry.key === 'OverExalt'
          const isRouse = entry.key === 'C1'
          const costValue = getCardDisplayCost(entry.record.cost, meta.costKind, exaltBaseCost)
          const nameColor = getDatabaseSkillNameColor({
            skillType: isExalt ? 'exalt' : 'command',
            isRouse,
            isOverExalt: entry.key === 'OverExalt',
          })
          const isHighlighted = entry.record.id === highlightedSkillId
          return (
            <div
              id={entry.record.id}
              className={`border px-3.5 py-2.5 shadow-sm transition-all duration-500 ease-out ${
                isHighlighted
                  ? 'scale-[1.01] border-amber-400/80 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.25)]'
                  : 'border-white/4 bg-white/2'
              }`}
              data-skill-name={entry.record.displayName}
              key={meta.key}
            >
              <div className='flex items-center justify-between gap-3' data-card-header=''>
                <div className='flex min-w-0 flex-1 items-center gap-2.5 text-slate-300'>
                  <button
                    type='button'
                    className='flex min-w-0 cursor-pointer items-center gap-2.5 bg-transparent p-0 text-inherit transition-colors hover:text-amber-100'
                    onClick={(event) => {
                      const popoverEntry: KeyedDatabaseReferenceEntry = {
                        key: entry.key,
                        name: entry.record.displayName,
                        label: entry.label,
                        description: entry.resolved.description,
                        record: entry.record,
                        descriptionRank: entry.descriptionRank,
                        descriptionMaxRank: entry.descriptionMaxRank,
                        influenceBadges: entry.influenceBadges,
                        navigationTarget: {kind: 'skills'},
                      }
                      openRootInfo(popoverEntry, {
                        currentTarget: event.currentTarget,
                        stopPropagation: () => undefined,
                      })
                    }}
                  >
                    <span
                      className='inline-flex shrink-0 items-center gap-1.5 text-slate-300'
                      style={getDatabaseDetailBodyTextStyle()}
                    >
                      {isExalt ? (
                        aliemusIcon && (
                          <img
                            alt=''
                            aria-hidden='true'
                            className='relative -top-px h-[1.3em] w-[1.3em] object-contain'
                            draggable={false}
                            src={aliemusIcon}
                          />
                        )
                      ) : (
                        <img
                          alt=''
                          aria-hidden='true'
                          className='relative -top-px h-[1.3em] w-[1.3em] object-contain opacity-90'
                          draggable={false}
                          src={costIcon}
                        />
                      )}
                      <span
                        className='font-bold'
                        style={isExalt ? {color: 'rgba(253,230,138,0.9)'} : {color: '#ededed'}}
                      >
                        {costValue}
                      </span>
                    </span>
                    <span className='h-3 w-px shrink-0 bg-white/12' />
                    <span
                      className={DATABASE_ITEM_NAME_CLASS}
                      style={{
                        ...getDatabaseDetailBodyTextStyle(),
                        color: nameColor,
                      }}
                    >
                      {entry.record.displayName}
                    </span>
                  </button>
                </div>
                <div className='flex shrink-0 items-center gap-3'>
                  <AwakenerEnlightenInfluenceBadges
                    align='end'
                    influenceBadges={entry.influenceBadges ?? []}
                    openMode='root'
                    onToggleEnlightenSlot={onToggleEnlightenSlot}
                    selectedEnlightenSlot={selectedEnlightenSlot}
                  />
                  <span
                    className='shrink-0 text-slate-500 italic'
                    style={getDatabaseDetailBodyTextStyle()}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
              <div className='mt-1.5 mb-1 h-px w-full bg-gradient-to-r from-white/8 via-white/3 to-transparent' />
              <div
                className={`mt-1 ${DATABASE_DETAIL_BODY_CLASS}`}
                style={getDatabaseDetailBodyTextStyle()}
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
  highlightedSkillId,
}: AwakenerDetailCardsProps) {
  const openRootReferenceByName = usePopoverStore((state) => state.openRootReferenceByName)
  const exaltBaseCost = useMemo(
    () => shellView?.exalts.find((entry) => entry.key === 'Exalt')?.record.cost,
    [shellView],
  )
  useEffect(() => {
    if (highlightedSkillId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(highlightedSkillId)
        if (element) {
          element.scrollIntoView({behavior: 'smooth', block: 'center'})
        }
      }, 80)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [highlightedSkillId])
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
              entry.key === 'OverExalt' ? (
                <button
                  className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
                  onClick={(event) => {
                    openRootReferenceByName('Over Exalt', event)
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
          highlightedSkillId={highlightedSkillId}
        />
        <AwakenerCardSection
          entries={shellView.commandCards}
          exaltBaseCost={exaltBaseCost}
          formulaContext={shellView.formulaContext}
          getEntryMeta={(entry) => ({
            key: entry.key,
            label:
              entry.key === 'C1' ? (
                <button
                  className='cursor-pointer text-slate-500 transition-colors hover:text-amber-100'
                  onClick={(event) => {
                    openRootReferenceByName('Rouse', event)
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
          highlightedSkillId={highlightedSkillId}
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
            highlightedSkillId={highlightedSkillId}
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
