export type DatabaseDetailKind = 'awakener' | 'wheel' | 'posse' | 'covenant' | 'relic'

export function preloadDatabaseDetail(kind: DatabaseDetailKind, id: string): void {
  preloadDatabaseDetailHost()
  void import('../detail/dbDetailRegistry').then((module) => {
    module.preloadDatabaseDetail(kind, id)
  })
}

export function preloadDatabaseDetailHost(): void {
  void import('../detail/DbDetailModalHost')
}
