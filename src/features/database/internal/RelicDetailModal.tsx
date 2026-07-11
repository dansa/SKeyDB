import {Fragment, useMemo} from 'react'

import {useStore} from 'zustand'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import type {RelicDatabaseDescriptionRecord} from '@/domain/description-records'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import {
  getDefaultRelicVariant,
  getRelicVariantById,
  normalizeRelicDescriptionTemplate,
  type PublicRelicRecord,
  type Relic,
} from '@/domain/relics'
import {DbDetailShell} from '@/features/database/detail/DbDetailShell'
import {OwnerAwakenerMetaLink} from '@/features/database/detail/OwnerAwakenerMetaLink'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
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
import {getRelicVariantMetadataLabels} from './relic-database-presentation'
import {RelicVariantMobileSwitcher} from './RelicVariantMobileSwitcher'
import {RelicVariantRail} from './RelicVariantRail'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'
import {WheelLoreText} from './WheelLoreText'

function getNonEmptyText(primary: string | undefined, fallback: string | undefined): string {
  if (primary?.trim()) return primary
  if (fallback?.trim()) return fallback
  return ''
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

export function RelicDetailModal({
  fullData,
  item,
  navigation = null,
  onClose,
  onRelicVariantChange,
  onSelectAwakener,
  selectedVariantId,
}: RelicDetailModalProps) {
  const {preferences, updateSharedPreferences} = useDatabaseDetailPreferences()
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
  const metadataLabels = getRelicVariantMetadataLabels(selectedVariant)
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
      preserveSideArtIntrinsicSize
      sideArtClassName='object-contain'
      sideArtContainerClassName='p-4'
      sideArtWidthClassName='w-[12rem]'
      sideArtFooter={
        <RelicVariantRail
          itemName={item.name}
          onSelect={(variantId) => {
            onRelicVariantChange?.(variantId)
          }}
          selectedId={selectedVariant.id}
          variants={fullData.variants}
        />
      }
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
                  {metadataLabels.map((label, index) => (
                    <Fragment key={label}>
                      {index > 0 ? (
                        <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
                      ) : null}
                      <span>{label}</span>
                    </Fragment>
                  ))}
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

          <RelicVariantMobileSwitcher
            onSelect={(variantId) => {
              onRelicVariantChange?.(variantId)
            }}
            selectedId={selectedVariant.id}
            variants={fullData.variants}
          />

          <div className='ui-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'>
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
