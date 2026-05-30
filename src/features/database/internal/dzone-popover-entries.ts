import type {RelicDatabaseDescriptionRecord} from '@/domain/description-records'
import type {DzoneMonsterAlertStats, DzoneResolvedMonster} from '@/domain/dzone'
import {loadRelicRecordById, type PublicRelicRecord} from '@/domain/relics'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

type DatabaseDescriptionSection = NonNullable<
  KeyedDatabaseReferenceEntry['descriptionSections']
>[number]

function buildRelicDescriptionRecord(record: PublicRelicRecord): RelicDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'relic',
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function getMonsterDescriptionText(monster: DzoneResolvedMonster): string | undefined {
  return monster.descriptionTemplate.trim() ? monster.descriptionTemplate : undefined
}

function formatDzoneMonsterHp(hp: number): string {
  if (hp >= 1000000) return `${formatCompactNumber(hp / 1000000)}M`
  if (hp > 100000) return `${formatCompactNumber(hp / 1000)}K`
  if (hp >= 10000) return `${formatCompactNumber(hp / 1000)}K`
  return hp.toString()
}

function formatCompactNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1)
}

function formatPercent(value: number): string {
  const percent = value * 100
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded.toString()}%` : `${rounded.toFixed(1)}%`
}

function buildDzoneMonsterAlertMetaText(stats: DzoneMonsterAlertStats): string {
  return buildDzoneMonsterAlertMetaSegments(stats)
    .map((segment) => segment.text)
    .join('')
}

function buildDzoneMonsterAlertMetaSegments(stats: DzoneMonsterAlertStats) {
  const displayHp = stats.effectiveHp ?? stats.hp
  const segments = [
    {text: 'Level '},
    {text: stats.level.toString(), tone: 'value' as const},
    {text: ' · HP '},
    {text: formatDzoneMonsterHp(displayHp), tone: 'value' as const},
  ]

  if (stats.effectiveHp && stats.effectiveHp !== stats.hp) {
    segments.push({text: ' total'})
  }

  if (stats.hpBars && stats.hpBars > 1) {
    segments.push({text: ' · '}, {text: `${stats.hpBars.toString()} bars`})
  }

  return segments
}

function buildDzoneMonsterHpAttributeRows(stats: DzoneMonsterAlertStats) {
  const hpBarValues = stats.hpBarValues
  if (!hpBarValues || hpBarValues.length <= 1) {
    return undefined
  }
  const rows = [
    {
      label: 'HP bars',
      value: hpBarValues.map(formatDzoneMonsterHp).join(' › '),
    },
  ]
  const rouseText = buildDzoneMonsterRouseText(stats)
  if (rouseText) {
    rows.push({label: 'Rouse', value: rouseText})
  }
  return rows
}

function buildDzoneMonsterRouseText(stats: DzoneMonsterAlertStats): string | undefined {
  const phases = stats.hpBarPhases?.filter((phase) => phase.bar > 1) ?? []
  let previousMultiplier = 1
  const segments: string[] = []

  for (const phase of phases) {
    const details = []
    const maxHpMultiplier =
      phase.maxHpMultiplier !== undefined && phase.maxHpMultiplier !== 1
        ? phase.maxHpMultiplier
        : undefined
    const repeatsPreviousMultiplier =
      maxHpMultiplier !== undefined && maxHpMultiplier === previousMultiplier
    if (
      maxHpMultiplier !== undefined &&
      !repeatsPreviousMultiplier &&
      (phase.kind === 'maxHpMultiplier' || phase.kind === 'maxHpMultiplierPartialRevive')
    ) {
      details.push(`max HP ×${formatCompactNumber(maxHpMultiplier)}`)
    }
    if (
      phase.healPercent !== undefined &&
      phase.healPercent !== 1 &&
      (phase.kind === 'partialRevive' || phase.kind === 'maxHpMultiplierPartialRevive')
    ) {
      details.push(
        `${phase.healPercent < 1 ? 'revives at' : 'heals to'} ${formatPercent(phase.healPercent)}`,
      )
    }
    if (maxHpMultiplier !== undefined) {
      previousMultiplier = maxHpMultiplier
    }
    if (details.length > 0) {
      segments.push(`Bar ${phase.bar.toString()} ${details.join(', ')}`)
    }
  }

  return segments.length > 0 ? segments.join('; ') : undefined
}

export function buildDzoneMonsterPopoverEntry({
  monster,
  thumbnailSrc,
}: {
  monster: DzoneResolvedMonster
  thumbnailSrc?: string
}): KeyedDatabaseReferenceEntry {
  const descriptionText = getMonsterDescriptionText(monster)

  return {
    key: `dzone-monster:${monster.id}`,
    name: monster.name,
    label: monster.alertStats ? buildDzoneMonsterAlertMetaText(monster.alertStats) : '',
    labelSegments: monster.alertStats
      ? buildDzoneMonsterAlertMetaSegments(monster.alertStats)
      : undefined,
    description: '',
    attributeRows: monster.alertStats
      ? buildDzoneMonsterHpAttributeRows(monster.alertStats)
      : undefined,
    thumbnail: thumbnailSrc ? {src: thumbnailSrc, alt: monster.name} : undefined,
    descriptionSections: [
      descriptionText
        ? {label: 'Description', description: descriptionText, tone: 'lore' as const}
        : null,
      ...monster.characteristics.map((characteristic) => ({
        label: characteristic.name,
        description: characteristic.descriptionTemplate,
      })),
    ].filter((section): section is DatabaseDescriptionSection => Boolean(section)),
  }
}

export function buildDzoneRelicPopoverEntry({
  record,
  thumbnailSrc,
}: {
  record: PublicRelicRecord
  thumbnailSrc?: string
}): KeyedDatabaseReferenceEntry {
  const descriptionRecord = buildRelicDescriptionRecord(record)
  const descriptionSections = record.lore
    ? [
        {
          label: 'Effect',
          description: record.descriptionTemplate,
          record: descriptionRecord,
        },
        {
          label: 'Lore',
          description: record.lore,
          tone: 'lore' as const,
        },
      ]
    : undefined

  return {
    key: `dzone-relic:${record.id}`,
    name: record.name,
    label: '',
    description: record.descriptionTemplate,
    record: descriptionRecord,
    thumbnail: thumbnailSrc ? {src: thumbnailSrc, alt: record.name} : undefined,
    descriptionSections,
  }
}

export async function loadDzoneRelicPopoverEntry({
  relicId,
  thumbnailSrc,
}: {
  relicId: string
  thumbnailSrc?: string
}): Promise<KeyedDatabaseReferenceEntry | undefined> {
  const record = await loadRelicRecordById(relicId)
  return record ? buildDzoneRelicPopoverEntry({record, thumbnailSrc}) : undefined
}
