import {useMemo} from 'react'

import {resolvePublicAsset} from '@/data-access/public-data/assetRepository'
import type {OrisonDatabaseDescriptionRecord} from '@/domain/description-records'
import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'
import {getOrisonAssetByAssetId} from '@/domain/orison-assets'
import {
  getDefaultOrisonVariant,
  getOrisonVariantById,
  type Orison,
  type PublicOrisonRecord,
} from '@/domain/orisons'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {DbDetailShell} from '@/features/database/detail/DbDetailShell'
import {ResponsiveDetailArt} from '@/features/database/detail/ResponsiveDetailArt'

import type {DatabaseDetailResultNavigation} from '../detail/database-detail-result-navigation'
import {
  DATABASE_DETAIL_BODY_CLASS,
  DATABASE_DETAIL_HEADER_META_CLASS,
  DATABASE_DETAIL_HEADER_TITLE_CLASS,
  DATABASE_DETAIL_META_ROW_CLASS,
  DATABASE_DETAIL_META_SEPARATOR_CLASS,
  DATABASE_DETAIL_SECTION_HEADING_CLASS,
  getDatabaseDetailBodyStyle,
  getDatabaseDetailSectionHeadingStyle,
} from './database-detail-typography'
import {DatabaseFamilyVariantMobileSwitcher} from './DatabaseFamilyVariantMobileSwitcher'
import {DatabaseFamilyVariantRail} from './DatabaseFamilyVariantRail'
import {DatabaseScopedRichDescription} from './DatabaseScopedRichDescription'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabaseFamilyVariantNavigationKeys} from './useDatabaseFamilyVariantNavigationKeys'
import {useDatabasePopoverController} from './useDatabasePopoverController'

export function OrisonDetailModal({
  fullData,
  item,
  navigation = null,
  onClose,
  onOrisonVariantChange,
  selectedVariantId,
}: {
  fullData: PublicOrisonRecord
  item: Orison
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onOrisonVariantChange?: (variantId?: string) => void
  selectedVariantId?: string
}) {
  const {preferences, updateSharedPreferences} = useDatabaseDetailPreferences()
  const formulaContext = useMemo(
    () => buildPublicFormulaContext({accountLevel: preferences.shared.accountLevel}),
    [preferences.shared.accountLevel],
  )
  const selectedVariant =
    (selectedVariantId ? getOrisonVariantById(fullData, selectedVariantId) : undefined) ??
    getDefaultOrisonVariant(fullData)
  const variantOptions = useMemo(
    () =>
      fullData.variants.map((variant) => ({
        id: variant.id,
        label: variant.tier,
        name: variant.name,
      })),
    [fullData.variants],
  )
  useDatabaseFamilyVariantNavigationKeys({
    onSelect: onOrisonVariantChange,
    selectedId: selectedVariant.id,
    variants: fullData.variants,
  })
  const effectRecord = useMemo<OrisonDatabaseDescriptionRecord>(
    () => ({
      id: selectedVariant.id,
      kind: 'orison',
      displayName: selectedVariant.name,
      descriptionTemplate: selectedVariant.descriptionTemplate || fullData.descriptionTemplate,
      descriptionArgs: Object.keys(selectedVariant.descriptionArgs).length
        ? selectedVariant.descriptionArgs
        : fullData.descriptionArgs,
    }),
    [fullData.descriptionArgs, fullData.descriptionTemplate, selectedVariant],
  )
  const referenceLayer = useMemo(
    () =>
      buildGlobalDatabaseReferenceLayer({
        extraReferences: [{label: 'Orison', record: effectRecord}],
        formulaContext,
      }),
    [effectRecord, formulaContext],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const variantAssetId = resolvePublicAsset(selectedVariant.assets.icon)?.assetId
  const artAsset = getOrisonAssetByAssetId(variantAssetId ?? item.assetId)

  return (
    <DbDetailShell
      artAsset={artAsset}
      fullArtAlt={`${item.name} orison art`}
      itemName={item.name}
      kindLabel='orison'
      navigation={navigation}
      onClose={onClose}
      popoverController={popoverController}
      preferences={preferences}
      preserveSideArtIntrinsicSize
      sideArtClassName='object-contain'
      sideArtContainerClassName='p-4'
      sideArtWidthClassName='w-[12rem]'
      sideArtFooter={
        <DatabaseFamilyVariantRail
          entityLabel='Orison'
          itemName={item.name}
          onSelect={(variantId) => {
            onOrisonVariantChange?.(variantId)
          }}
          selectedId={selectedVariant.id}
          variants={variantOptions}
        />
      }
      updateSharedPreferences={updateSharedPreferences}
    >
      {({isMobileViewport, openArtViewer}) => (
        <>
          <div className='shrink-0 border-b border-slate-800/75 pr-20 pb-5'>
            <div className='flex items-center gap-4'>
              <ResponsiveDetailArt isMobileViewport={isMobileViewport} viewport='mobile'>
                {artAsset ? (
                  <button
                    aria-label={`View full art for ${item.name}`}
                    className='size-16 shrink-0'
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
              </ResponsiveDetailArt>
              <div className='min-w-0'>
                <h3 className={DATABASE_DETAIL_HEADER_TITLE_CLASS}>{item.name}</h3>
                <p
                  className={`${DATABASE_DETAIL_META_ROW_CLASS} ${DATABASE_DETAIL_HEADER_META_CLASS}`}
                >
                  <span>{selectedVariant.tier}</span>
                  <span className={DATABASE_DETAIL_META_SEPARATOR_CLASS}>•</span>
                  <span>{selectedVariant.orisonType === 'STANDARD' ? 'Standard' : 'Special'}</span>
                </p>
              </div>
            </div>
          </div>
          <DatabaseFamilyVariantMobileSwitcher
            entityLabel='Orison'
            onSelect={(variantId) => {
              onOrisonVariantChange?.(variantId)
            }}
            selectedId={selectedVariant.id}
            variants={variantOptions}
          />
          <div className='ui-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-6 pl-2'>
            <section className='mt-5'>
              <h4
                className={DATABASE_DETAIL_SECTION_HEADING_CLASS}
                style={getDatabaseDetailSectionHeadingStyle()}
              >
                Effect
              </h4>
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
            </section>
          </div>
        </>
      )}
    </DbDetailShell>
  )
}
