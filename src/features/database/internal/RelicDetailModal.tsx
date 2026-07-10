import {useEffect, useMemo} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'
import {useStore} from 'zustand'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {RelicDatabaseDescriptionRecord} from '@/domain/description-records'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import {getRelicDatabaseCategoryFilterLabel} from '@/domain/relic-database-browse-state'
import {
  getDefaultRelicVariant,
  getRelicVariantById,
  normalizeRelicDescriptionTemplate,
  type PublicRelicRecord,
  type PublicRelicVariant,
  type Relic,
} from '@/domain/relics'
import {DbDetailShell} from '@/features/database/detail/DbDetailShell'
import {OwnerAwakenerMetaLink} from '@/features/database/detail/OwnerAwakenerMetaLink'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_PRIMARY_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from '@/features/database/internal/database-detail-typography'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import type {DatabaseDetailResultNavigation} from '../detail/database-detail-result-navigation'
import {DatabaseScopedRichDescription} from './DatabaseScopedRichDescription'
import {buildRelicVariantLabels, getRelicVariantTypeLabel} from './relic-database-presentation'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {WheelLoreText} from './WheelLoreText'

const VARIANT_CONTROL_CLASS =
  'ui-compact-control ui-compact-control--field h-10 border-slate-700/70 bg-slate-950/86 text-[0.64rem] text-slate-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-700/70 disabled:hover:text-slate-200 sm:h-8'

function getNonEmptyText(primary: string | undefined, fallback: string | undefined): string {
  if (primary?.trim()) return primary
  if (fallback?.trim()) return fallback
  return ''
}

function RelicVariantNavigator({
  onSelect,
  selectedId,
  variants,
}: {
  onSelect: (variantId: string) => void
  selectedId: string
  variants: readonly PublicRelicVariant[]
}) {
  if (variants.length < 2) {
    return null
  }

  const selectedIndex = variants.findIndex((variant) => variant.id === selectedId)
  const labels = buildRelicVariantLabels(variants)
  const controlLabel = labels.get(selectedId) ?? 'Variant'

  return (
    <div className='shrink-0 border-b border-slate-800/75 py-3 pr-1 sm:py-2.5'>
      <fieldset className='m-0 flex min-w-0 items-center gap-1.5 border-0 p-0'>
        <legend className='sr-only'>Relic variant</legend>
        <button
          aria-label='Previous relic variant'
          className={`${VARIANT_CONTROL_CLASS} inline-flex w-10 shrink-0 items-center justify-center p-0 sm:w-8`}
          disabled={selectedIndex <= 0}
          onClick={() => {
            onSelect(variants[selectedIndex - 1].id)
          }}
          type='button'
        >
          <FaChevronLeft aria-hidden className='size-3' />
        </button>
        <label className='min-w-0 flex-1'>
          <span className='sr-only'>Relic variant</span>
          <select
            aria-label='Relic variant'
            className={`${VARIANT_CONTROL_CLASS} w-full min-w-0 [color-scheme:dark]`}
            onChange={(event) => {
              onSelect(event.target.value)
            }}
            title={controlLabel}
            value={selectedId}
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {labels.get(variant.id) ?? variant.label}
              </option>
            ))}
          </select>
        </label>
        <button
          aria-label='Next relic variant'
          className={`${VARIANT_CONTROL_CLASS} inline-flex w-10 shrink-0 items-center justify-center p-0 sm:w-8`}
          disabled={selectedIndex >= variants.length - 1}
          onClick={() => {
            onSelect(variants[selectedIndex + 1].id)
          }}
          type='button'
        >
          <FaChevronRight aria-hidden className='size-3' />
        </button>
        <output className='w-12 shrink-0 text-center text-[0.64rem] text-slate-400 tabular-nums'>
          {(selectedIndex + 1).toString()} / {variants.length.toString()}
        </output>
      </fieldset>
    </div>
  )
}

interface RelicDetailModalProps {
  fullData: PublicRelicRecord
  item: Relic
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onRelicVariantChange?: (variantId?: string) => void
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
  selectedVariantId?: string
}

export function RelicDetailModal(props: RelicDetailModalProps) {
  return <RelicDetailModalInner key={props.item.id} {...props} />
}

function RelicDetailModalInner({
  fullData,
  item,
  navigation = null,
  onClose,
  onRelicVariantChange,
  onSelectAwakener,
  selectedVariantId,
}: RelicDetailModalProps) {
  const {preferences, updateSharedPreferences} = useDatabaseDetailPreferences()
  useEffect(() => {
    collectionOwnershipStore.getState().hydrate()
  }, [])
  const collectionOwnership = useStore(collectionOwnershipStore, (state) => state.ownership)
  const formulaContext = useMemo(
    () =>
      buildPublicFormulaContext({
        accountLevel: preferences.shared.accountLevel,
        collectionOwnership,
      }),
    [collectionOwnership, preferences.shared.accountLevel],
  )
  const selectedVariant =
    (selectedVariantId ? getRelicVariantById(fullData, selectedVariantId) : undefined) ??
    getDefaultRelicVariant(fullData)
  const canonicalVariantId = selectedVariant.id

  useEffect(() => {
    if (selectedVariantId !== canonicalVariantId) {
      onRelicVariantChange?.(canonicalVariantId)
    }
  }, [canonicalVariantId, onRelicVariantChange, selectedVariantId])

  const effectRecord = useMemo<RelicDatabaseDescriptionRecord>(() => {
    const variantHasEffect = Boolean(selectedVariant.descriptionTemplate.trim())
    return {
      id: selectedVariant.id,
      kind: 'relic',
      displayName: selectedVariant.name,
      descriptionTemplate: normalizeRelicDescriptionTemplate(
        getNonEmptyText(selectedVariant.descriptionTemplate, fullData.descriptionTemplate),
      ),
      descriptionArgs: variantHasEffect
        ? selectedVariant.descriptionArgs
        : fullData.descriptionArgs,
    }
  }, [fullData.descriptionArgs, fullData.descriptionTemplate, selectedVariant])
  const referenceLayer = useMemo(
    () =>
      buildGlobalDatabaseReferenceLayer({
        extraReferences: [{label: 'Relic', record: effectRecord}],
        formulaContext,
      }),
    [effectRecord, formulaContext],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const artAsset = getRelicAssetByAssetId(item.assetId)
  const category = selectedVariant.category
  const rarity = selectedVariant.rarity
  const ownerAwakenerId = selectedVariant.ownerAwakenerId ?? fullData.ownerAwakenerId
  const ownerAwakenerName = selectedVariant.ownerAwakenerName ?? fullData.ownerAwakenerName
  const lore = getNonEmptyText(selectedVariant.lore, fullData.lore)

  return (
    <DbDetailShell
      artAsset={artAsset}
      fullArtAlt={`${item.name} relic art`}
      itemName={item.name}
      kindLabel='relic'
      navigation={navigation}
      onClose={onClose}
      popoverController={popoverController}
      preferences={preferences}
      sideArtClassName='object-contain p-10 lg:p-14'
      updateSharedPreferences={updateSharedPreferences}
    >
      {({openArtViewer}) => (
        <>
          <div className='shrink-0 border-b border-slate-800/75 pr-20 pb-5'>
            <div className='flex items-center gap-4'>
              {artAsset ? (
                <button
                  aria-label={`View full art for ${item.name}`}
                  className='size-16 shrink-0 md:hidden'
                  onClick={openArtViewer}
                  type='button'
                >
                  <img
                    alt=''
                    className='h-full w-full object-contain'
                    draggable={false}
                    src={artAsset}
                  />
                </button>
              ) : null}
              <div className='min-w-0'>
                <h3 className={DATABASE_DETAIL_HEADER_TITLE_CLASS}>{item.name}</h3>
                <p
                  className={`${DATABASE_DETAIL_META_ROW_CLASS} ${DATABASE_DETAIL_HEADER_META_CLASS}`}
                >
                  {rarity ? (
                    <>
                      <span className={DATABASE_DETAIL_META_PRIMARY_CLASS}>{rarity}</span>
                      <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
                    </>
                  ) : null}
                  <span>{getRelicVariantTypeLabel(selectedVariant.variantType)}</span>
                  {category ? (
                    <>
                      <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
                      <span>{getRelicDatabaseCategoryFilterLabel(category)}</span>
                    </>
                  ) : null}
                  <OwnerAwakenerMetaLink
                    onSelectAwakener={onSelectAwakener}
                    ownerAwakenerId={ownerAwakenerId}
                    ownerAwakenerName={ownerAwakenerName}
                  />
                  {selectedVariant.mechanicOwner ? (
                    <>
                      <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
                      <span>Mechanic: {selectedVariant.mechanicOwner}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          <RelicVariantNavigator
            onSelect={(variantId) => {
              onRelicVariantChange?.(variantId)
            }}
            selectedId={selectedVariant.id}
            variants={fullData.variants}
          />

          <div className='database-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'>
            <div className='relic-detail-content-fade' key={selectedVariant.id}>
              <section className='mt-5'>
                <h4
                  className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                  style={getDatabaseDetailSectionHeadingStyle()}
                >
                  Effect
                </h4>
                {effectRecord.descriptionTemplate.trim() ? (
                  <p
                    className={`mt-3 max-w-[68ch] ${DATABASE_DETAIL_BODY_CLASS}`}
                    style={getDatabaseDetailBodyStyle()}
                  >
                    <DatabaseScopedRichDescription
                      formulaContext={formulaContext}
                      record={effectRecord}
                      referenceLayer={referenceLayer}
                      showTagIcons={preferences.shared.showTagIcons}
                    />
                  </p>
                ) : (
                  <p className='mt-3 text-sm text-slate-500'>
                    No effect text is available for this variant.
                  </p>
                )}
              </section>

              <section className='mt-5 border-t border-slate-800/80 pt-4'>
                <h4
                  className={DATABASE_DETAIL_SECTION_HEADING_MUTED_CLASS}
                  style={getDatabaseDetailSectionHeadingStyle()}
                >
                  Lore
                </h4>
                {lore.trim() ? (
                  <WheelLoreText defaultExpanded lore={lore} previewLineCount={999} />
                ) : (
                  <p className='mt-3 text-sm text-slate-500'>
                    No lore text is available for this variant.
                  </p>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </DbDetailShell>
  )
}
