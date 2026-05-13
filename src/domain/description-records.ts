import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
} from './awakener-source-schema'
import type {CovenantSetEffectRecord} from './covenants-full'
import {
  buildDescriptionArgHover,
  formatDescriptionArgProgression,
  getDescriptionArgKeysInTemplateOrder,
  resolveDescriptionArgs,
  resolveDescriptionTemplate,
  type DescriptionArgProgressionContext,
  type DescriptionArgResolveContext,
  type ResolvedDescriptionArg,
} from './description-args'
import type {PosseFullRecord} from './posses-full'
import type {PublicDescriptionArg} from './public-description-args'
import type {WheelFullRecord} from './wheels-full'

export interface WheelDatabaseDescriptionRecord {
  id: string
  kind: 'wheel'
  displayName: string
  ownerAwakenerId?: string
  descriptionTemplate: string
  descriptionArgs: WheelFullRecord['descriptionArgs']
}

export interface PosseDatabaseDescriptionRecord {
  id: string
  kind: 'posse'
  displayName: string
  ownerAwakenerId?: string
  descriptionTemplate: string
  descriptionArgs: PosseFullRecord['descriptionArgs']
}

export interface CovenantDatabaseDescriptionRecord {
  id: string
  kind: 'covenant'
  displayName: string
  descriptionTemplate: string
  descriptionArgs: CovenantSetEffectRecord['descriptionArgs']
}

export interface RelicDatabaseDescriptionRecord {
  id: string
  kind: 'relic'
  displayName: string
  descriptionTemplate: string
  descriptionArgs: Record<string, PublicDescriptionArg>
}

export type DescribedRecord =
  | AwakenerSkillRecord
  | AwakenerTalentRecord
  | AwakenerEnlightenRecord
  | DerivedSkillRecord
  | AwakenerOverlayRecord
  | WheelDatabaseDescriptionRecord
  | PosseDatabaseDescriptionRecord
  | CovenantDatabaseDescriptionRecord
  | RelicDatabaseDescriptionRecord

export interface ResolvedDescribedRecordArgEntry {
  key: string
  resolved: ResolvedDescriptionArg
  progression: string
  hover: string
}

export interface ResolvedDescribedRecord<TRecord extends DescribedRecord> {
  record: TRecord
  description: string
  resolvedArgs: Record<string, ResolvedDescriptionArg>
  orderedArgEntries: ResolvedDescribedRecordArgEntry[]
}

function buildOrderedArgEntries(
  record: DescribedRecord,
  resolvedArgs: Record<string, ResolvedDescriptionArg>,
  progressionContext: DescriptionArgProgressionContext,
): ResolvedDescribedRecordArgEntry[] {
  const orderedKeys = getDescriptionArgKeysInTemplateOrder(
    record.descriptionTemplate,
    record.descriptionArgs,
  )

  const entries: ResolvedDescribedRecordArgEntry[] = []

  for (const key of orderedKeys) {
    const resolved = resolvedArgs[key]
    const arg = record.descriptionArgs[key]
    entries.push({
      key,
      resolved,
      progression: formatDescriptionArgProgression(arg, progressionContext),
      hover: buildDescriptionArgHover(arg, progressionContext),
    })
  }

  return entries
}

export function resolveDescribedRecord<TRecord extends DescribedRecord>(
  record: TRecord,
  resolveContext: DescriptionArgResolveContext = {},
  progressionContext: DescriptionArgProgressionContext = {},
): ResolvedDescribedRecord<TRecord> {
  const resolvedArgs = resolveDescriptionArgs(record.descriptionArgs, resolveContext)
  const description = resolveDescriptionTemplate(
    record.descriptionTemplate,
    record.descriptionArgs,
    resolveContext,
  )

  return {
    record,
    description,
    resolvedArgs,
    orderedArgEntries: buildOrderedArgEntries(record, resolvedArgs, progressionContext),
  }
}
