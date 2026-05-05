/* eslint-disable react-refresh/only-export-components */
import {lazy, type ReactNode} from 'react'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord} from '@/domain/awakeners-full'
import type {Covenant} from '@/domain/covenants'
import type {CovenantFullRecord} from '@/domain/covenants-full'
import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'
import {
  buildDatabaseCovenantBrowsePath,
  buildDatabasePosseBrowsePath,
  buildDatabaseWheelBrowsePath,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityKind} from '@/domain/entities/types'
import type {Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import {
  loadPublicAwakenerDetailById,
  loadPublicCovenantDetailById,
  loadPublicPosseDetailById,
  loadPublicWheelDetailById,
} from '@/domain/public-detail-record-adapters'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {SimpleArtifactDetailModal} from '@/features/database/internal/SimpleArtifactDetailModal'

const AwakenerDetailModal = lazy(() =>
  import('@/features/database/internal/AwakenerDetailModal').then((module) => ({
    default: module.AwakenerDetailModal,
  })),
)
const WheelDetailModal = lazy(() =>
  import('@/features/database/internal/WheelDetailModal').then((module) => ({
    default: module.WheelDetailModal,
  })),
)

export type DatabaseDetailKind = Extract<EntityKind, 'awakener' | 'wheel' | 'posse' | 'covenant'>

export interface DatabaseDetailRenderCallbacks {
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel: (wheel: Pick<Wheel, 'name'>) => void
  onSelectCovenant: (covenant: Pick<Covenant, 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export type DatabaseDetailRouteItem =
  | {kind: 'awakener'; item: Awakener; activeTab: DatabaseAwakenerTab}
  | {kind: 'wheel'; item: Wheel}
  | {kind: 'posse'; item: Posse}
  | {kind: 'covenant'; item: Covenant}

interface DatabaseDetailRenderOptions {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  item: DatabaseDetailRouteItem
  record: object
  wheels: Wheel[]
}

interface DatabaseDetailRegistryEntry {
  loadRecord: (id: string) => Promise<object | undefined>
  loadingLabel: string
  missingBrowsePath: string
  render: (options: DatabaseDetailRenderOptions) => ReactNode
}

export const dbDetailRegistry: Record<DatabaseDetailKind, DatabaseDetailRegistryEntry> = {
  awakener: {
    loadRecord: loadPublicAwakenerDetailById,
    loadingLabel: 'Loading awakener details...',
    missingBrowsePath: buildDatabaseEntityBrowsePath('awakeners'),
    render: ({awakeners, callbacks, item, record}) => {
      if (item.kind !== 'awakener') {
        throw new Error('Awakener detail registry received a non-awakener item')
      }

      return (
        <AwakenerDetailModal
          activeTab={item.activeTab}
          awakener={item.item}
          awakeners={awakeners}
          fullData={record as AwakenerFullRecord}
          key={item.item.id}
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
          onSelectCovenant={callbacks.onSelectCovenant}
          onSelectWheel={callbacks.onSelectWheel}
          onTabChange={callbacks.onTabChange}
        />
      )
    },
  },
  wheel: {
    loadRecord: loadPublicWheelDetailById,
    loadingLabel: 'Loading wheel details...',
    missingBrowsePath: buildDatabaseWheelBrowsePath(),
    render: ({callbacks, item, record, wheels}) => {
      if (item.kind !== 'wheel') {
        throw new Error('Wheel detail registry received a non-wheel item')
      }

      return (
        <WheelDetailModal
          fullData={record as WheelFullRecord}
          key={item.item.id}
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
          onSelectWheel={callbacks.onSelectWheel}
          wheel={item.item}
          wheels={wheels}
        />
      )
    },
  },
  posse: {
    loadRecord: loadPublicPosseDetailById,
    loadingLabel: 'Loading posse details...',
    missingBrowsePath: buildDatabasePosseBrowsePath(),
    render: ({callbacks, item, record}) => {
      if (item.kind !== 'posse') {
        throw new Error('Posse detail registry received a non-posse item')
      }

      return (
        <SimpleArtifactDetailModal
          fullData={record as PosseFullRecord}
          item={item.item}
          kind='posse'
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
        />
      )
    },
  },
  covenant: {
    loadRecord: loadPublicCovenantDetailById,
    loadingLabel: 'Loading covenant details...',
    missingBrowsePath: buildDatabaseCovenantBrowsePath(),
    render: ({callbacks, item, record}) => {
      if (item.kind !== 'covenant') {
        throw new Error('Covenant detail registry received a non-covenant item')
      }

      return (
        <SimpleArtifactDetailModal
          fullData={record as CovenantFullRecord}
          item={item.item}
          kind='covenant'
          onClose={callbacks.onClose}
        />
      )
    },
  },
}
