import {safeStorageRead, safeStorageWrite, type StorageLike} from '@/domain/storage'

import {
  isDomainStorageMigrationSnapshot,
  type DomainStorageMigrationEntry,
  type DomainStorageMigrationSnapshot,
} from './storageMigrationSnapshot'

export type DomainStorageMigrationPlanStatus = 'copy' | 'unchanged' | 'conflict'
export type DomainStorageMigrationDecision = 'copy-source' | 'keep-target'

export interface DomainStorageMigrationPlanItem {
  key: string
  category: DomainStorageMigrationEntry['category']
  sourceValue: string
  targetValue: string | null
  status: DomainStorageMigrationPlanStatus
}

export interface DomainStorageMigrationPlan {
  ok: true
  snapshot: DomainStorageMigrationSnapshot
  items: DomainStorageMigrationPlanItem[]
  summary: {
    copy: number
    unchanged: number
    conflict: number
  }
}

export interface InvalidDomainStorageMigrationPlan {
  ok: false
  error: 'invalid_snapshot'
}

export type PlanDomainStorageMigrationResult =
  | DomainStorageMigrationPlan
  | InvalidDomainStorageMigrationPlan

export interface DomainStorageMigrationBackup {
  kind: 'skeydb.domain-storage-migration.backup'
  version: 1
  createdAt: string
  sourceOrigin: string
  entries: {
    key: string
    value: string
  }[]
}

export type DomainStorageMigrationApplyResult =
  | {
      ok: true
      copied: string[]
      kept: string[]
      unchanged: string[]
      backupKey: string | null
    }
  | {
      ok: false
      error: 'storage_unavailable' | 'missing_conflict_decision' | 'backup_failed' | 'write_failed'
      key?: string
    }

export function planDomainStorageMigration(
  snapshot: unknown,
  targetStorage: StorageLike | null,
): PlanDomainStorageMigrationResult {
  if (!isDomainStorageMigrationSnapshot(snapshot)) {
    return {ok: false, error: 'invalid_snapshot'}
  }

  const items = snapshot.entries.map((entry): DomainStorageMigrationPlanItem => {
    const targetValue = safeStorageRead(targetStorage, entry.key)
    return {
      key: entry.key,
      category: entry.category,
      sourceValue: entry.value,
      targetValue,
      status: resolvePlanStatus(entry.value, targetValue),
    }
  })

  return {
    ok: true,
    snapshot,
    items,
    summary: {
      copy: items.filter((item) => item.status === 'copy').length,
      unchanged: items.filter((item) => item.status === 'unchanged').length,
      conflict: items.filter((item) => item.status === 'conflict').length,
    },
  }
}

export function applyDomainStorageMigrationPlan(
  plan: DomainStorageMigrationPlan,
  targetStorage: StorageLike | null,
  decisions: Partial<Record<string, DomainStorageMigrationDecision>>,
  now: Date = new Date(),
): DomainStorageMigrationApplyResult {
  if (!targetStorage) {
    return {ok: false, error: 'storage_unavailable'}
  }

  const copied: string[] = []
  const kept: string[] = []
  const unchanged: string[] = []
  const replacements: DomainStorageMigrationPlanItem[] = []

  for (const item of plan.items) {
    if (item.status === 'unchanged') {
      unchanged.push(item.key)
      continue
    }

    if (item.status === 'copy') {
      copied.push(item.key)
      continue
    }

    const decision = decisions[item.key]
    if (!decision) {
      return {ok: false, error: 'missing_conflict_decision', key: item.key}
    }

    if (decision === 'keep-target') {
      kept.push(item.key)
      continue
    }

    copied.push(item.key)
    replacements.push(item)
  }

  const backupKey = replacements.length ? `skeydb.migration.backup.${now.toISOString()}.v1` : null

  if (backupKey) {
    const backup: DomainStorageMigrationBackup = {
      kind: 'skeydb.domain-storage-migration.backup',
      version: 1,
      createdAt: now.toISOString(),
      sourceOrigin: plan.snapshot.sourceOrigin,
      entries: replacements.flatMap((item) =>
        item.targetValue === null ? [] : [{key: item.key, value: item.targetValue}],
      ),
    }

    if (!safeStorageWrite(targetStorage, backupKey, JSON.stringify(backup))) {
      return {ok: false, error: 'backup_failed', key: backupKey}
    }
  }

  for (const item of plan.items) {
    const shouldCopy =
      item.status === 'copy' ||
      (item.status === 'conflict' && decisions[item.key] === 'copy-source')
    if (!shouldCopy) {
      continue
    }

    if (!safeStorageWrite(targetStorage, item.key, item.sourceValue)) {
      return {ok: false, error: 'write_failed', key: item.key}
    }
  }

  return {ok: true, copied, kept, unchanged, backupKey}
}

function resolvePlanStatus(
  sourceValue: string,
  targetValue: string | null,
): DomainStorageMigrationPlanStatus {
  if (targetValue === null) {
    return 'copy'
  }

  return targetValue === sourceValue ? 'unchanged' : 'conflict'
}
