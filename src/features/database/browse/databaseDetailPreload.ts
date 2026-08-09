export type {DatabaseDetailKind} from '@/domain/database-entity-definitions'
import type {DatabaseDetailKind} from '@/domain/database-entity-definitions'

export function preloadDatabaseDetail(kind: DatabaseDetailKind, id: string): void {
  preloadDatabaseDetailHost()
  void import('../detail/dbDetailRegistry').then((module) => {
    module.preloadDatabaseDetailShell(kind)
    module.preloadDatabaseDetailRecordByKind(kind, id)
  })
}

export function preloadDatabaseDetailShell(kind: DatabaseDetailKind): void {
  preloadDatabaseDetailHost()
  void import('../detail/dbDetailRegistry').then((module) => {
    module.preloadDatabaseDetailShell(kind)
  })
}

export function preloadDatabaseDetailHost(): void {
  void import('../detail/DbDetailModalHost')
}
