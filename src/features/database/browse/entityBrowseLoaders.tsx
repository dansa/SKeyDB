import {lazy, type ReactNode} from 'react'

import type {DatabaseEntityId} from '@/domain/database-entity-paths'

import type {EntityBrowseProps} from './EntityBrowseShared'

const AwakenersBrowse = lazy(() =>
  import('./AwakenersBrowse').then(({AwakenersBrowse: component}) => ({default: component})),
)
const WheelsBrowse = lazy(() =>
  import('./WheelsBrowse').then(({WheelsBrowse: component}) => ({default: component})),
)
const PossesBrowse = lazy(() =>
  import('./PossesBrowse').then(({PossesBrowse: component}) => ({default: component})),
)
const CovenantsBrowse = lazy(() =>
  import('./CovenantsBrowse').then(({CovenantsBrowse: component}) => ({default: component})),
)
const RelicsBrowse = lazy(() =>
  import('./RelicsBrowse').then(({RelicsBrowse: component}) => ({default: component})),
)

export function EntityBrowseLoader({
  entity,
  ...props
}: EntityBrowseProps & {entity: DatabaseEntityId}): ReactNode {
  switch (entity) {
    case 'awakeners':
      return <AwakenersBrowse {...props} />
    case 'wheels':
      return <WheelsBrowse {...props} />
    case 'posses':
      return <PossesBrowse {...props} />
    case 'covenants':
      return <CovenantsBrowse {...props} />
    case 'relics':
      return <RelicsBrowse {...props} />
  }
}
