import type {CovenantFullRecord} from '@/domain/covenants-full'
import {resolveDescribedRecord} from '@/domain/description-records'
import {
  buildCovenantDatabaseDescriptionRecord,
  buildGlobalDatabaseReferenceLayer,
} from '@/domain/global-database-reference-layer'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

interface CovenantSetEntry {
  description: string
  label: string
  record: ReturnType<typeof buildCovenantDatabaseDescriptionRecord>
}

function buildSetEntry(
  covenantRecord: CovenantFullRecord,
  setEffect: CovenantFullRecord['setEffects'][number],
): CovenantSetEntry {
  const record = buildCovenantDatabaseDescriptionRecord({
    id: `${covenantRecord.id}:${setEffect.set.toString()}`,
    name: covenantRecord.name,
    descriptionTemplate: setEffect.descriptionTemplate,
    descriptionArgs: setEffect.descriptionArgs,
  })
  const resolved = resolveDescribedRecord(record)

  return {
    label: `Covenant · ${setEffect.set.toString()} Set`,
    description: resolved.description,
    record,
  }
}

export function buildCovenantPopoverEntry(
  covenantRecord: CovenantFullRecord,
): KeyedDatabaseReferenceEntry {
  const entries = covenantRecord.setEffects.map((setEffect) =>
    buildSetEntry(covenantRecord, setEffect),
  )
  const referenceLayer = buildGlobalDatabaseReferenceLayer({
    extraReferences: entries.map((entry) => ({record: entry.record, label: entry.label})),
  })

  return {
    key: `covenant:${covenantRecord.id}:preview`,
    name: covenantRecord.name,
    label: 'Covenant',
    description: entries.map((entry) => entry.description).join('\n\n'),
    descriptionSections: entries.map((entry) => ({
      label: entry.label.replace('Covenant · ', ''),
      description: entry.description,
      record: entry.record,
    })),
    navigationLabel: 'Open in Covenants DB',
    navigationTarget: {
      kind: 'covenant-page',
      covenantName: covenantRecord.name,
    },
    referenceLayerOverride: referenceLayer,
  }
}
