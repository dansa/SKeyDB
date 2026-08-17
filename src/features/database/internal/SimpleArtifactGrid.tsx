import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import {getPosseBadgeAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {SimpleArtifactGridCard} from './SimpleArtifactGridCard'

interface PosseGridProps {
  posses: Posse[]
  onPreloadPosse?: (posseId: string) => void
  onSelectPosse: (posseId: string) => void
  onWarmPosseShell?: () => void
}

export function PosseGrid({
  onPreloadPosse,
  onSelectPosse,
  onWarmPosseShell,
  posses,
}: PosseGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No posses match the current filters.'
      gridLayout='square-art'
      items={posses}
      renderItem={(posse, index) => (
        <SimpleArtifactGridCard
          id={posse.id}
          imageSrc={getPosseBadgeAssetById(posse.id)}
          index={index}
          imageTreatment='badge'
          key={posse.id}
          name={posse.name}
          onPreload={onPreloadPosse}
          onSelect={onSelectPosse}
          onWarmShell={onWarmPosseShell}
          realm={posse.realm}
        />
      )}
    />
  )
}

interface CovenantGridProps {
  covenants: Covenant[]
  onPreloadCovenant?: (covenantId: string) => void
  onSelectCovenant: (covenantId: string) => void
  onWarmCovenantShell?: () => void
}

export function CovenantGrid({
  covenants,
  onPreloadCovenant,
  onSelectCovenant,
  onWarmCovenantShell,
}: CovenantGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No covenants match the current search.'
      gridLayout='square-art'
      items={covenants}
      renderItem={(covenant, index) => (
        <SimpleArtifactGridCard
          id={covenant.id}
          imageSrc={getCovenantAssetById(covenant.id)}
          index={index}
          imageTreatment='emblem'
          key={covenant.id}
          name={covenant.name}
          onPreload={onPreloadCovenant}
          onSelect={onSelectCovenant}
          onWarmShell={onWarmCovenantShell}
        />
      )}
    />
  )
}
