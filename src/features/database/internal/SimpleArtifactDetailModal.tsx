import {useEffect, useMemo} from 'react'

import {useStore} from 'zustand'

import {getCovenantAssetById, getCovenantFullArtAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import type {CovenantFullRecord} from '@/domain/covenants-full'
import type {DatabaseAwakenerTab} from '@/domain/database-paths'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildGlobalDatabaseReferenceLayer,
  buildPosseDatabaseDescriptionRecord,
} from '@/domain/global-database-reference-layer'
import {getPosseAssetById, getPosseFullArtAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import type {DatabaseDetailResultNavigation} from '@/features/database/detail/database-detail-result-navigation'
import {DbDetailShell} from '@/features/database/detail/DbDetailShell'
import {
  PosseMeta,
  SimpleArtifactDetailBody,
} from '@/features/database/detail/SimpleArtifactDetailBody'
import {collectionOwnershipStore} from '@/stores/collectionOwnershipStore'

import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {useDatabasePopoverController} from './useDatabasePopoverController'

interface PosseDetailModalProps {
  kind: 'posse'
  item: Posse
  fullData: PosseFullRecord
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onSelectAwakener?: (awakener: {id: string; name: string}, tab?: DatabaseAwakenerTab) => void
}

interface CovenantDetailModalProps {
  kind: 'covenant'
  item: Covenant
  fullData: CovenantFullRecord
  navigation?: DatabaseDetailResultNavigation | null
  onClose: () => void
  onSelectAwakener?: never
}

type SimpleArtifactDetailModalProps = PosseDetailModalProps | CovenantDetailModalProps
export function SimpleArtifactDetailModal(props: SimpleArtifactDetailModalProps) {
  return <SimpleArtifactDetailModalInner {...props} key={props.item.id} />
}

function SimpleArtifactDetailModalInner({
  fullData,
  item,
  kind,
  navigation = null,
  onClose,
  onSelectAwakener,
}: SimpleArtifactDetailModalProps) {
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
  const descriptions = useMemo(() => {
    if (kind === 'posse') {
      const record = buildPosseDatabaseDescriptionRecord(fullData)
      return [{heading: 'Description', record, label: 'Posse'}]
    }

    return fullData.setEffects.map((effect) => {
      const record = buildCovenantDatabaseDescriptionRecord({
        id: `${fullData.id}:${effect.set.toString()}`,
        name: `${fullData.name} ${effect.set.toString()} Set`,
        descriptionTemplate: effect.descriptionTemplate,
        descriptionArgs: effect.descriptionArgs,
      })
      return {heading: `${effect.set.toString()} Set`, record, label: 'Covenant'}
    })
  }, [fullData, kind])
  const referenceLayer = useMemo(
    () =>
      buildGlobalDatabaseReferenceLayer({
        extraReferences: descriptions.map((entry) => ({record: entry.record, label: entry.label})),
        formulaContext,
      }),
    [descriptions, formulaContext],
  )
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer,
    showTagIcons: preferences.shared.showTagIcons,
  })
  const artAsset =
    kind === 'posse' ? getPosseFullArtAssetById(item.id) : getCovenantFullArtAssetById(item.id)
  const headerIconAsset =
    kind === 'posse' ? getPosseAssetById(item.id) : getCovenantAssetById(item.id)
  const fullArtAlt = `${item.name} full art`

  return (
    <DbDetailShell
      artAsset={artAsset}
      fullArtAlt={fullArtAlt}
      itemName={item.name}
      kindLabel={kind}
      navigation={navigation}
      onClose={onClose}
      popoverController={popoverController}
      preferences={preferences}
      showSideArtGradient={kind === 'posse'}
      sideArtClassName={kind === 'posse' ? 'object-cover' : 'object-contain p-2'}
      updateSharedPreferences={updateSharedPreferences}
    >
      {({openArtViewer}) => (
        <SimpleArtifactDetailBody
          descriptions={descriptions}
          formulaContext={formulaContext}
          headerIconAsset={headerIconAsset}
          headerIconClassName={`object-contain ${kind === 'covenant' ? 'scale-150' : ''}`}
          itemName={item.name}
          lore={fullData.lore}
          meta={
            kind === 'posse' ? (
              <PosseMeta fullData={fullData} onSelectAwakener={onSelectAwakener} posse={item} />
            ) : null
          }
          onOpenArtViewer={openArtViewer}
          referenceLayer={referenceLayer}
          showTagIcons={preferences.shared.showTagIcons}
          acquisitionSource={fullData.acquisitionSource}
        />
      )}
    </DbDetailShell>
  )
}
