import type {ReactNode} from 'react'

import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import type {DatabaseDetailResultSet} from '@/features/database/detail/database-detail-result-navigation'

import {AwakenersBrowse, CovenantsBrowse, PossesBrowse, WheelsBrowse} from './EntityBrowseViews'
import type {EntityBrowseController} from './useEntityBrowseController'

interface EntityBrowseProps {
  controller: EntityBrowseController
  renderDetailModalHost: (resultSet: DatabaseDetailResultSet) => ReactNode
}

interface EntityBrowseRegistryEntry {
  allowedUrlParams: readonly string[]
  Component: (props: EntityBrowseProps) => ReactNode
  title: string
  unitNoun: string
}

export const entityBrowseRegistry: Record<DatabaseEntityId, EntityBrowseRegistryEntry> = {
  awakeners: {
    allowedUrlParams: ['q', 'realm', 'rarity', 'type', 'availability', 'sort', 'dir', 'group'],
    title: 'Awakeners',
    unitNoun: 'awakeners',
    Component: AwakenersBrowse,
  },
  wheels: {
    allowedUrlParams: ['q', 'realm', 'rarity', 'mainstat', 'sort', 'dir'],
    title: 'Wheels',
    unitNoun: 'wheels',
    Component: WheelsBrowse,
  },
  posses: {
    allowedUrlParams: ['q', 'realm'],
    title: 'Posses',
    unitNoun: 'posses',
    Component: PossesBrowse,
  },
  covenants: {
    allowedUrlParams: ['q'],
    title: 'Covenants',
    unitNoun: 'covenants',
    Component: CovenantsBrowse,
  },
}

export function renderEntityBrowse(
  controller: EntityBrowseController,
  renderDetailModalHost: (resultSet: DatabaseDetailResultSet) => ReactNode,
): ReactNode {
  const BrowseComponent = entityBrowseRegistry[controller.activeEntity].Component
  return <BrowseComponent controller={controller} renderDetailModalHost={renderDetailModalHost} />
}
