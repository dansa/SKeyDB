import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import {getPosseBadgeAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {SimpleArtifactGridCard} from './SimpleArtifactGridCard'

interface PosseGridProps {
  posses: Posse[]
  onSelectPosse: (posseId: string) => void
}

export function PosseGrid({onSelectPosse, posses}: PosseGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No posses match the current filters.'
      items={posses}
      layout='square-art'
      renderItem={(posse, index) => (
        <SimpleArtifactGridCard
          id={posse.id}
          imageSrc={getPosseBadgeAssetById(posse.id)}
          index={index}
          imageTreatment='badge'
          key={posse.id}
          name={posse.name}
          onSelect={onSelectPosse}
          realm={posse.realm}
        />
      )}
    />
  )
}

interface CovenantGridProps {
  covenants: Covenant[]
  onSelectCovenant: (covenantId: string) => void
}

export function CovenantGrid({covenants, onSelectCovenant}: CovenantGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No covenants match the current search.'
      items={covenants}
      layout='square-art'
      renderItem={(covenant, index) => (
        <SimpleArtifactGridCard
          id={covenant.id}
          imageSrc={getCovenantAssetById(covenant.id)}
          index={index}
          imageTreatment='emblem'
          key={covenant.id}
          name={covenant.name}
          onSelect={onSelectCovenant}
        />
      )}
    />
  )
}
