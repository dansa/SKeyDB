import type {DatabaseEntityId} from '@/domain/database-entity-paths'

export type DatabaseDetailKind = 'awakener' | 'wheel' | 'posse' | 'covenant' | 'relic'

export function getDatabaseDetailKindForEntity(entity: DatabaseEntityId): DatabaseDetailKind {
  switch (entity) {
    case 'awakeners':
      return 'awakener'
    case 'wheels':
      return 'wheel'
    case 'posses':
      return 'posse'
    case 'covenants':
      return 'covenant'
    case 'relics':
      return 'relic'
  }
}

export function preloadDatabaseDetail(kind: DatabaseDetailKind, id: string): void {
  void import('../detail/dbDetailRegistry').then((module) => {
    module.preloadDatabaseDetail(kind, id)
  })
}

export function preloadDatabaseDetailShell(kind: DatabaseDetailKind): void {
  void import('../detail/dbDetailRegistry').then((module) => {
    module.preloadDatabaseDetailShell(kind)
  })
}
