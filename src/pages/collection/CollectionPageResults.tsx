import type {ReactNode, WheelEvent} from 'react'

import {FaRotateRight} from 'react-icons/fa6'

import {Button} from '@/components/ui/Button'
import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {OwnedTogglePill} from '@/components/ui/OwnedTogglePill'
import {TabbedContainer} from '@/components/ui/TabbedContainer'
import {getAwakenerCardAsset} from '@/domain/awakener-assets'
import {getRealmTint} from '@/domain/factions'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getWheelAssetById} from '@/domain/wheel-assets'

import {AwakenerLevelControl} from './AwakenerLevelControl'
import {CollectionLevelControls} from './CollectionLevelControls'
import type {CollectionViewModel} from './useCollectionViewModel'

const collectionTabs = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'posses', label: 'Posses'},
] as const

interface CollectionPageResultsProps {
  model: CollectionViewModel
  onSwallowOutsideLevelClickIfCardInteraction: (event: MouseEvent | PointerEvent) => void
  onCollectionCardWheel: (
    event: WheelEvent<HTMLElement>,
    kind: 'awakeners' | 'wheels',
    id: string,
    ownedLevel: number | null,
    awakenerName?: string,
  ) => void
}

function renderCollectionRightActions(model: CollectionViewModel): ReactNode {
  if (model.tab === 'awakeners') {
    return (
      <div>
        <CollectionSortControls
          compactTrailingAction={
            model.awakenerSortHasPendingChanges ? (
              <Button
                aria-label='Apply changes'
                className='h-6 px-2 text-[11px] leading-none'
                onClick={model.applyAwakenerSortChanges}
                type='button'
              >
                <span className='inline-flex items-center gap-1'>
                  <FaRotateRight aria-hidden className='text-[10px]' />
                  <span className='max-sm:hidden'>Refresh</span>
                </span>
              </Button>
            ) : null
          }
          groupByRealm={model.awakenerSortGroupByRealm}
          layout='compact'
          onGroupByRealmChange={model.setAwakenerSortGroupByRealm}
          onSortDirectionToggle={model.toggleAwakenerSortDirection}
          onSortKeyChange={model.setAwakenerSortKey}
          showGroupByRealm={false}
          sortDirection={model.awakenerSortDirection}
          sortKey={model.awakenerSortKey}
          sortDirectionAriaLabel='Toggle collection awakener sort direction'
          sortSelectAriaLabel='Collection awakener sort key'
        />
      </div>
    )
  }

  if (model.tab === 'wheels' && model.wheelSortHasPendingChanges) {
    return (
      <Button
        className='px-2 py-1 text-[10px] tracking-wide uppercase'
        onClick={model.applyWheelSortChanges}
        type='button'
      >
        Apply Changes
      </Button>
    )
  }

  return null
}

function AwakenerCollectionCard({
  awakener,
  awakenerId,
  model,
  onCollectionCardWheel,
  onSwallowOutsideLevelClickIfCardInteraction,
}: {
  awakener: CollectionViewModel['filteredAwakeners'][number]
  awakenerId: string
  model: CollectionViewModel
  onCollectionCardWheel: CollectionPageResultsProps['onCollectionCardWheel']
  onSwallowOutsideLevelClickIfCardInteraction: CollectionPageResultsProps['onSwallowOutsideLevelClickIfCardInteraction']
}) {
  const ownedLevel = model.getAwakenerOwnedLevel(awakener.name)
  const cardAsset = getAwakenerCardAsset(awakener.name)

  return (
    <article className='collection-item-card group/collection p-1' key={awakener.name}>
      <div
        className={`collection-card-frame relative aspect-[25/56] overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
          ownedLevel === null ? 'collection-card-frame-unowned' : ''
        }`}
        onWheel={(event) => {
          onCollectionCardWheel(event, 'awakeners', awakenerId, ownedLevel, awakener.name)
        }}
      >
        <button
          aria-label={`Toggle ownership for ${formatAwakenerNameForUi(awakener.name)}`}
          className='absolute inset-0 z-[13]'
          onClick={(event) => {
            if (event.defaultPrevented) {
              return
            }
            model.toggleOwned('awakeners', awakenerId)
          }}
          type='button'
        />
        {cardAsset ? (
          <img
            alt={`${formatAwakenerNameForUi(awakener.name)} card`}
            className={`collection-card-art h-full w-full object-cover object-top ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={cardAsset}
          />
        ) : (
          <span className='sigil-placeholder sigil-placeholder-card' />
        )}
        <span
          className='pointer-events-none absolute inset-0 z-10 border'
          style={{borderColor: getRealmTint(awakener.realm)}}
        />
        <p className='collection-card-title ui-title'>{formatAwakenerNameForUi(awakener.name)}</p>
        <div className='collection-card-controls'>
          {ownedLevel !== null ? (
            <AwakenerLevelControl
              disabled={false}
              level={model.getAwakenerLevel(awakener.name)}
              name={formatAwakenerNameForUi(awakener.name)}
              onCommitOutsideClick={onSwallowOutsideLevelClickIfCardInteraction}
              onLevelChange={(nextLevel) => {
                model.setAwakenerLevel(awakener.name, nextLevel)
              }}
            />
          ) : null}
          <CollectionLevelControls
            onDecrease={() => {
              model.decreaseLevel('awakeners', awakenerId)
            }}
            onIncrease={() => {
              model.increaseLevel('awakeners', awakenerId)
            }}
            ownedLevel={ownedLevel}
          />
          <OwnedTogglePill
            className='ownership-pill-full'
            owned={ownedLevel !== null}
            onToggle={() => {
              model.toggleOwned('awakeners', awakenerId)
            }}
          />
        </div>
      </div>
    </article>
  )
}

function WheelCollectionCard({
  wheel,
  model,
  onCollectionCardWheel,
}: {
  wheel: CollectionViewModel['filteredWheels'][number]
  model: CollectionViewModel
  onCollectionCardWheel: CollectionPageResultsProps['onCollectionCardWheel']
}) {
  const ownedLevel = model.getWheelOwnedLevel(wheel.id)
  const wheelAsset = getWheelAssetById(wheel.id)

  return (
    <article className='collection-item-card group/collection p-1' key={wheel.id}>
      <div
        className={`collection-card-frame relative aspect-[75/113] overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
          ownedLevel === null ? 'collection-card-frame-unowned' : ''
        }`}
        onWheel={(event) => {
          onCollectionCardWheel(event, 'wheels', wheel.id, ownedLevel)
        }}
      >
        <button
          aria-label={`Toggle ownership for ${wheel.name}`}
          className='absolute inset-0 z-[13]'
          onClick={(event) => {
            if (event.defaultPrevented) {
              return
            }
            model.toggleOwned('wheels', wheel.id)
          }}
          type='button'
        />
        {wheelAsset ? (
          <img
            alt={`${wheel.name} wheel`}
            className={`collection-card-art builder-picker-wheel-image h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={wheelAsset}
          />
        ) : (
          <span className='sigil-placeholder sigil-placeholder-wheel' />
        )}
        <p className='collection-card-title collection-card-title-compact'>{wheel.name}</p>
        <div className='collection-card-controls'>
          <CollectionLevelControls
            onDecrease={() => {
              model.decreaseLevel('wheels', wheel.id)
            }}
            onIncrease={() => {
              model.increaseLevel('wheels', wheel.id)
            }}
            ownedLevel={ownedLevel}
          />
          <OwnedTogglePill
            className='ownership-pill-full'
            owned={ownedLevel !== null}
            onToggle={() => {
              model.toggleOwned('wheels', wheel.id)
            }}
          />
        </div>
      </div>
    </article>
  )
}

function PosseCollectionCard({
  posse,
  model,
}: {
  posse: CollectionViewModel['filteredPosses'][number]
  model: CollectionViewModel
}) {
  const ownedLevel = model.getPosseOwnedLevel(posse.id)
  const asset = getPosseAssetById(posse.id)

  return (
    <article className='collection-item-card group/collection p-1' key={posse.id}>
      <div
        className={`collection-card-frame relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/75 transition-[border-color,box-shadow] duration-150 group-hover/collection:border-amber-200/45 group-hover/collection:shadow-[0_0_0_1px_rgba(251,191,36,0.15)] ${
          ownedLevel === null ? 'collection-card-frame-unowned' : ''
        }`}
      >
        <button
          aria-label={`Toggle ownership for ${posse.name}`}
          className='absolute inset-0 z-[13]'
          onClick={(event) => {
            if (event.defaultPrevented) {
              return
            }
            model.toggleOwned('posses', posse.id)
          }}
          type='button'
        />
        {asset ? (
          <img
            alt={`${posse.name} posse`}
            className={`collection-card-art h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''}`}
            draggable={false}
            src={asset}
          />
        ) : (
          <span className='sigil-placeholder' />
        )}
        <p className='collection-card-title collection-card-title-compact'>{posse.name}</p>
      </div>
      <div className='collection-card-toolbar'>
        <OwnedTogglePill
          className='ownership-pill-full'
          owned={ownedLevel !== null}
          onToggle={() => {
            model.toggleOwned('posses', posse.id)
          }}
        />
      </div>
    </article>
  )
}

function renderCollectionTabContent({
  model,
  onSwallowOutsideLevelClickIfCardInteraction,
  onCollectionCardWheel,
}: CollectionPageResultsProps) {
  if (model.tab === 'awakeners') {
    return (
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
        {model.filteredAwakeners.map((awakener) => {
          const awakenerId = model.awakenerIdByName.get(awakener.name)
          if (!awakenerId) {
            return null
          }

          return (
            <AwakenerCollectionCard
              awakener={awakener}
              awakenerId={awakenerId}
              key={awakener.name}
              model={model}
              onCollectionCardWheel={onCollectionCardWheel}
              onSwallowOutsideLevelClickIfCardInteraction={
                onSwallowOutsideLevelClickIfCardInteraction
              }
            />
          )
        })}
      </div>
    )
  }

  if (model.tab === 'wheels') {
    return (
      <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
        {model.filteredWheels.map((wheel) => (
          <WheelCollectionCard
            key={wheel.id}
            model={model}
            onCollectionCardWheel={onCollectionCardWheel}
            wheel={wheel}
          />
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'>
      {model.filteredPosses.map((posse) => (
        <PosseCollectionCard key={posse.id} model={model} posse={posse} />
      ))}
    </div>
  )
}

export function CollectionPageResults(props: CollectionPageResultsProps) {
  const {model} = props

  return (
    <TabbedContainer
      activeTabId={model.tab}
      bodyClassName='p-2'
      className='max-h-[calc(100dvh-11.5rem)] overflow-hidden'
      onTabChange={(tabId) => {
        model.setTab(tabId as (typeof collectionTabs)[number]['id'])
      }}
      rightActions={renderCollectionRightActions(model)}
      tabs={collectionTabs.map((tab) => ({id: tab.id, label: tab.label}))}
    >
      <div className='collection-scrollbar max-h-[calc(100dvh-15rem)] min-h-[560px] overflow-auto pr-1'>
        {renderCollectionTabContent(props)}
      </div>
    </TabbedContainer>
  )
}
