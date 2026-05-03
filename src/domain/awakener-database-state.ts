import {z} from 'zod'

import {
  clampAwakenerDatabaseLevel,
  clampAwakenerDatabasePsycheSurgeOffset,
  resolveAwakenerStatsForLevel,
} from './awakener-level-scaling'
import {
  ENLIGHTEN_SLOT_KEYS,
  type AwakenerOverlayRecord,
  type DerivedSkillRecord,
  type FullStats,
} from './awakener-source-schema'
import {buildAwakenerDatabaseReferenceLayer} from './awakeners-database-reference-layer'
import {
  resolveAwakenerDatabaseShellView,
  type AwakenerDatabaseViewOptions,
  type ResolvedAwakenerDatabaseShellView,
} from './awakeners-database-view'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {getSoulforgeTalents, selectedEnlightenSlotSchema} from './awakeners-full-v2-contract'
import type {ResolvedDatabaseReferenceLayer} from './database-reference-layer'
import {resolveDescriptionArg} from './description-args'
import {buildPublicFormulaContext} from './public-formula-context'

export {selectedEnlightenSlotSchema} from './awakeners-full-v2-contract'

export const awakenerDatabaseSelectionSchema = z.object({
  awakenerLevel: z.number().default(60),
  psycheSurgeOffset: z.number().default(0),
  skillLevel: z.number().default(1),
  selectedEnlightenSlot: selectedEnlightenSlotSchema.default(null),
  soulforgeLevel: z.number().default(0),
})

export type AwakenerDatabaseSelection = z.infer<typeof awakenerDatabaseSelectionSchema>

export interface ResolvedAwakenerDatabaseState {
  selection: AwakenerDatabaseSelection
  controls: AwakenerDatabaseControls
  stats: FullStats
  shellView: ResolvedAwakenerDatabaseShellView
  referenceLayer: ResolvedDatabaseReferenceLayer
}

export interface AwakenerDatabaseControlOption {
  value: AwakenerDatabaseSelection['selectedEnlightenSlot']
  label: string
}

export interface AwakenerDatabaseControls {
  enlightenOptions: AwakenerDatabaseControlOption[]
  canAdjustPsycheSurge: boolean
  psycheSurgeOffsetMin: number
  psycheSurgeOffsetMax: number
  hasSoulforgeTalent: boolean
  skillLevelMin: number
  skillLevelMax: number
  soulforgeLevelMin: number | null
  soulforgeLevelMax: number | null
}

function getAvailableEnlightenSlots(
  record: AwakenerFullV2Record,
): NonNullable<AwakenerDatabaseSelection['selectedEnlightenSlot']>[] {
  return buildEnlightenOptions(record)
    .map((option) => option.value)
    .filter(
      (value): value is NonNullable<AwakenerDatabaseSelection['selectedEnlightenSlot']> =>
        value !== null,
    )
}

const DATABASE_MIN_SKILL_LEVEL = 1
const DATABASE_MAX_SKILL_LEVEL = 6

function clampDatabaseSkillLevel(level: number): number {
  const normalized = Number.isFinite(level) ? Math.round(level) : DATABASE_MIN_SKILL_LEVEL
  if (normalized < DATABASE_MIN_SKILL_LEVEL) {
    return DATABASE_MIN_SKILL_LEVEL
  }
  if (normalized > DATABASE_MAX_SKILL_LEVEL) {
    return DATABASE_MAX_SKILL_LEVEL
  }
  return normalized
}

function normalizeSoulforgeLevel(level: number | null): number {
  if (level === null || !Number.isFinite(level)) {
    return 0
  }

  return Math.max(0, Math.floor(level))
}

function buildEnlightenOptions(record: AwakenerFullV2Record): AwakenerDatabaseControlOption[] {
  return [
    {value: null, label: 'E0'},
    {value: 'E1', label: 'E1'},
    {value: 'E2', label: 'E2'},
    {value: 'E3', label: 'E3'},
    ...(record.enlightens.AbsoluteAxiom ? [{value: 'AbsoluteAxiom' as const, label: 'AA'}] : []),
  ]
}

function normalizeSelectedEnlightenSlotForRecord(
  record: AwakenerFullV2Record,
  slot: AwakenerDatabaseSelection['selectedEnlightenSlot'],
): AwakenerDatabaseSelection['selectedEnlightenSlot'] {
  if (slot === null) {
    return null
  }

  const availableSlots = getAvailableEnlightenSlots(record)
  for (let index = availableSlots.length - 1; index >= 0; index -= 1) {
    const candidate = availableSlots[index]
    if (ENLIGHTEN_SLOT_KEYS.indexOf(candidate) <= ENLIGHTEN_SLOT_KEYS.indexOf(slot)) {
      return candidate
    }
  }

  return null
}

function normalizeSoulforgeLevelForRecord(
  record: AwakenerFullV2Record,
  level: AwakenerDatabaseSelection['soulforgeLevel'],
): AwakenerDatabaseSelection['soulforgeLevel'] {
  const controls = getAwakenerDatabaseControls(record)
  if (controls.soulforgeLevelMax === null) {
    return 0
  }

  const normalizedLevel = normalizeSoulforgeLevel(level)
  return Math.max(
    controls.soulforgeLevelMin ?? 0,
    Math.min(controls.soulforgeLevelMax, normalizedLevel),
  )
}

export function getAwakenerDatabaseControls(
  record: AwakenerFullV2Record,
): AwakenerDatabaseControls {
  const soulforgeTalents = getSoulforgeTalents(record.talents)
  const canAdjustPsycheSurge = Object.values(record.substatScaling).some((value) => Boolean(value))
  const soulforgeLevelMax = soulforgeTalents.reduce<number | null>((max, entry) => {
    const entryMax = entry.maxLevel ?? 1
    if (max === null) {
      return entryMax
    }
    return Math.max(max, entryMax)
  }, null)

  return {
    enlightenOptions: buildEnlightenOptions(record),
    canAdjustPsycheSurge,
    psycheSurgeOffsetMin: 0,
    psycheSurgeOffsetMax: 12,
    hasSoulforgeTalent: soulforgeTalents.length > 0,
    skillLevelMin: 1,
    skillLevelMax: 6,
    soulforgeLevelMin: soulforgeLevelMax === null ? null : 0,
    soulforgeLevelMax,
  }
}

export function normalizeAwakenerDatabaseSelection(
  selection: Partial<AwakenerDatabaseSelection> = {},
): AwakenerDatabaseSelection {
  const parsed = awakenerDatabaseSelectionSchema.parse(selection)

  return {
    awakenerLevel: clampAwakenerDatabaseLevel(parsed.awakenerLevel),
    psycheSurgeOffset: clampAwakenerDatabasePsycheSurgeOffset(parsed.psycheSurgeOffset),
    skillLevel: clampDatabaseSkillLevel(parsed.skillLevel),
    selectedEnlightenSlot: parsed.selectedEnlightenSlot,
    soulforgeLevel: normalizeSoulforgeLevel(parsed.soulforgeLevel),
  }
}

export function getDefaultAwakenerDatabaseSelection(): AwakenerDatabaseSelection {
  return {
    ...normalizeAwakenerDatabaseSelection(),
    soulforgeLevel: 0,
  }
}

export function normalizeAwakenerDatabaseSelectionForRecord(
  record: AwakenerFullV2Record,
  selection: Partial<AwakenerDatabaseSelection> = {},
): AwakenerDatabaseSelection {
  const normalized = normalizeAwakenerDatabaseSelection(selection)

  return {
    ...normalized,
    selectedEnlightenSlot: normalizeSelectedEnlightenSlotForRecord(
      record,
      normalized.selectedEnlightenSlot,
    ),
    soulforgeLevel: normalizeSoulforgeLevelForRecord(record, normalized.soulforgeLevel),
  }
}

export function patchAwakenerDatabaseSelection(
  record: AwakenerFullV2Record,
  previousSelection: Partial<AwakenerDatabaseSelection> = {},
  nextPartial: Partial<AwakenerDatabaseSelection> = {},
): AwakenerDatabaseSelection {
  return normalizeAwakenerDatabaseSelectionForRecord(record, {
    ...getDefaultAwakenerDatabaseSelection(),
    ...previousSelection,
    ...nextPartial,
  })
}

export function resolveAwakenerDatabaseState(
  record: AwakenerFullV2Record,
  selection: Partial<AwakenerDatabaseSelection> = {},
  extraViewOptions: Omit<
    AwakenerDatabaseViewOptions,
    keyof AwakenerDatabaseSelection | 'stats'
  > = {},
  overlays?: AwakenerOverlayRecord[],
  derivedSkills?: DerivedSkillRecord[],
): ResolvedAwakenerDatabaseState {
  const normalizedSelection = normalizeAwakenerDatabaseSelectionForRecord(record, selection)
  const controls = getAwakenerDatabaseControls(record)
  const soulforgePrimaryStatBonusPercent = resolveSoulforgePrimaryStatBonusPercent(
    record,
    normalizedSelection.soulforgeLevel,
  )
  const stats = resolveAwakenerStatsForLevel(
    record,
    normalizedSelection.awakenerLevel,
    normalizedSelection.psycheSurgeOffset,
    soulforgePrimaryStatBonusPercent,
  )

  const shellView = resolveAwakenerDatabaseShellView(
    record,
    {
      ...extraViewOptions,
      skillLevel: normalizedSelection.skillLevel,
      stats,
      formulaContext: extraViewOptions.formulaContext ?? buildPublicFormulaContext(),
      selectedEnlightenSlot: normalizedSelection.selectedEnlightenSlot,
      soulforgeLevel: normalizedSelection.soulforgeLevel,
    },
    overlays,
  )

  return {
    selection: normalizedSelection,
    controls,
    stats,
    shellView,
    referenceLayer: buildAwakenerDatabaseReferenceLayer({shellView, overlays, derivedSkills}),
  }
}

function resolveSoulforgePrimaryStatBonusPercent(
  record: AwakenerFullV2Record,
  soulforgeLevel: number,
): number {
  if (soulforgeLevel <= 0) {
    return 0
  }

  const soulforgeTalent = getSoulforgeTalents(record.talents).at(0)
  if (!soulforgeTalent) {
    return 0
  }

  const statArg = Object.hasOwn(soulforgeTalent.descriptionArgs, 'Arg1')
    ? soulforgeTalent.descriptionArgs.Arg1
    : undefined
  if (!statArg) {
    return 0
  }

  return resolveDescriptionArg(statArg, {rank: soulforgeLevel}).totalValue ?? 0
}
