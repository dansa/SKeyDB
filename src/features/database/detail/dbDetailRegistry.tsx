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
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'

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
const SimpleArtifactDetailModal = lazy(() =>
  import('@/features/database/internal/SimpleArtifactDetailModal').then((module) => ({
    default: module.SimpleArtifactDetailModal,
  })),
)

export type DatabaseDetailKind = Extract<EntityKind, 'awakener' | 'wheel' | 'posse' | 'covenant'>

export interface DatabaseDetailRenderCallbacks {
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel: (wheel: Pick<Wheel, 'id' | 'name'>) => void
  onSelectCovenant: (covenant: Pick<Covenant, 'id' | 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export type DatabaseDetailRouteItem =
  | {kind: 'awakener'; item: Awakener; activeTab: DatabaseAwakenerTab}
  | {kind: 'wheel'; item: Wheel}
  | {kind: 'posse'; item: Posse}
  | {kind: 'covenant'; item: Covenant}

export type DatabaseDetailRouteItemByKind = {
  [Kind in DatabaseDetailKind]: Extract<DatabaseDetailRouteItem, {kind: Kind}>
}

interface DatabaseDetailRecordByKind {
  awakener: AwakenerFullRecord
  wheel: WheelFullRecord
  posse: PosseFullRecord
  covenant: CovenantFullRecord
}

interface DatabaseDetailRenderOptions<Kind extends DatabaseDetailKind> {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  item: DatabaseDetailRouteItemByKind[Kind]
  record: DatabaseDetailRecordByKind[Kind]
  wheels: Wheel[]
}

interface DatabaseDetailRegistryEntry<Kind extends DatabaseDetailKind> {
  loadRecord: (id: string) => Promise<DatabaseDetailRecordByKind[Kind] | undefined>
  loadingLabel: string
  missingBrowsePath: string
  render: (options: DatabaseDetailRenderOptions<Kind>) => ReactNode
}

export type DatabaseDetailRegistry = {
  [Kind in DatabaseDetailKind]: DatabaseDetailRegistryEntry<Kind>
}

async function loadAwakenerDetailRecord(id: string) {
  const {loadPublicAwakenerDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicAwakenerDetailById(id)
}

async function loadWheelDetailRecord(id: string) {
  const {loadPublicWheelDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicWheelDetailById(id)
}

async function loadPosseDetailRecord(id: string) {
  const {loadPublicPosseDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicPosseDetailById(id)
}

async function loadCovenantDetailRecord(id: string) {
  const {loadPublicCovenantDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicCovenantDetailById(id)
}

export const dbDetailRegistry: DatabaseDetailRegistry = {
  awakener: {
    loadRecord: loadAwakenerDetailRecord,
    loadingLabel: 'Loading awakener details...',
    missingBrowsePath: buildDatabaseEntityBrowsePath('awakeners'),
    render: ({awakeners, callbacks, item, record}) => {
      return (
        <AwakenerDetailModal
          activeTab={item.activeTab}
          awakener={item.item}
          awakeners={awakeners}
          fullData={record}
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
    loadRecord: loadWheelDetailRecord,
    loadingLabel: 'Loading wheel details...',
    missingBrowsePath: buildDatabaseWheelBrowsePath(),
    render: ({callbacks, item, record, wheels}) => {
      return (
        <WheelDetailModal
          fullData={record}
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
    loadRecord: loadPosseDetailRecord,
    loadingLabel: 'Loading posse details...',
    missingBrowsePath: buildDatabasePosseBrowsePath(),
    render: ({callbacks, item, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='posse'
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
        />
      )
    },
  },
  covenant: {
    loadRecord: loadCovenantDetailRecord,
    loadingLabel: 'Loading covenant details...',
    missingBrowsePath: buildDatabaseCovenantBrowsePath(),
    render: ({callbacks, item, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='covenant'
          onClose={callbacks.onClose}
        />
      )
    },
  },
}
