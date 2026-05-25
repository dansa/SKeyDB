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
import {type AwakenerFullRecord} from './awakeners-full'
import {
  getGnosticPotentialTalents,
  getSoulforgeTalents,
  selectedEnlightenSlotSchema,
} from './awakeners-full-contract'
import type {ResolvedDatabaseReferenceLayer} from './database-reference-layer'
import {resolveDescriptionArg} from './description-args'
import {buildPublicFormulaContext} from './public-formula-context'

export {selectedEnlightenSlotSchema} from './awakeners-full-contract'

export const awakenerDatabaseSelectionSchema = z.object({
  awakenerLevel: z.number().default(60),
  psycheSurgeOffset: z.number().default(0),
  skillLevel: z.number().default(1),
  selectedEnlightenSlot: selectedEnlightenSlotSchema.default(null),
  soulforgeLevel: z.number().default(0),
  gnosticPotentialLevel: z.number().default(0),
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
  hasGnosticPotentialTalent: boolean
  canAdjustGnosticPotential: boolean
  skillLevelMin: number
  skillLevelMax: number
  soulforgeLevelMin: number | null
  soulforgeLevelMax: number | null
  gnosticPotentialLevelMin: number | null
  gnosticPotentialLevelMax: number | null
}

function getAvailableEnlightenSlots(
  record: AwakenerFullRecord,
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

function normalizeNonNegativeLevel(level: number | null): number {
  if (level === null || !Number.isFinite(level)) {
    return 0
  }

  return Math.max(0, Math.floor(level))
}

function buildEnlightenOptions(record: AwakenerFullRecord): AwakenerDatabaseControlOption[] {
  return [
    {value: null, label: 'E0'},
    {value: 'E1', label: 'E1'},
    {value: 'E2', label: 'E2'},
    {value: 'E3', label: 'E3'},
    ...(record.enlightens.AbsoluteAxiom ? [{value: 'AbsoluteAxiom' as const, label: 'AA'}] : []),
  ]
}

function normalizeSelectedEnlightenSlotForRecord(
  record: AwakenerFullRecord,
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
  record: AwakenerFullRecord,
  level: AwakenerDatabaseSelection['soulforgeLevel'],
): AwakenerDatabaseSelection['soulforgeLevel'] {
  const controls = getAwakenerDatabaseControls(record)
  if (controls.soulforgeLevelMax === null) {
    return 0
  }

  const normalizedLevel = normalizeNonNegativeLevel(level)
  return Math.max(
    controls.soulforgeLevelMin ?? 0,
    Math.min(controls.soulforgeLevelMax, normalizedLevel),
  )
}

function normalizeGnosticPotentialLevelForRecord(
  record: AwakenerFullRecord,
  level: AwakenerDatabaseSelection['gnosticPotentialLevel'],
): AwakenerDatabaseSelection['gnosticPotentialLevel'] {
  const gnosticTalent = getGnosticPotentialTalents(record.talents).at(0)
  if (!gnosticTalent) {
    return 0
  }

  const maxLevel = gnosticTalent.maxLevel ?? 1
  if (gnosticTalent.defaultMaxed) {
    return maxLevel
  }

  return Math.max(0, Math.min(maxLevel, normalizeNonNegativeLevel(level)))
}

export function getAwakenerDatabaseControls(record: AwakenerFullRecord): AwakenerDatabaseControls {
  const soulforgeTalents = getSoulforgeTalents(record.talents)
  const gnosticTalents = getGnosticPotentialTalents(record.talents)
  const gnosticTalent = gnosticTalents.at(0)
  const canAdjustPsycheSurge = Object.values(record.substatScaling).some((value) => Boolean(value))
  const soulforgeLevelMax = soulforgeTalents.reduce<number | null>((max, entry) => {
    const entryMax = entry.maxLevel ?? 1
    if (max === null) {
      return entryMax
    }
    return Math.max(max, entryMax)
  }, null)
  const gnosticPotentialLevelMax = gnosticTalents.reduce<number | null>((max, entry) => {
    const entryMax = entry.maxLevel ?? 1
    if (max === null) {
      return entryMax
    }
    return Math.max(max, entryMax)
  }, null)
  const canAdjustGnosticPotential = Boolean(gnosticTalent && !gnosticTalent.defaultMaxed)

  return {
    enlightenOptions: buildEnlightenOptions(record),
    canAdjustPsycheSurge,
    psycheSurgeOffsetMin: 0,
    psycheSurgeOffsetMax: 12,
    hasSoulforgeTalent: soulforgeTalents.length > 0,
    hasGnosticPotentialTalent: gnosticTalents.length > 0,
    canAdjustGnosticPotential,
    skillLevelMin: 1,
    skillLevelMax: 6,
    soulforgeLevelMin: soulforgeLevelMax === null ? null : 0,
    soulforgeLevelMax,
    gnosticPotentialLevelMin: canAdjustGnosticPotential ? 0 : null,
    gnosticPotentialLevelMax,
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
    soulforgeLevel: normalizeNonNegativeLevel(parsed.soulforgeLevel),
    gnosticPotentialLevel: normalizeNonNegativeLevel(parsed.gnosticPotentialLevel),
  }
}

export function getDefaultAwakenerDatabaseSelection(): AwakenerDatabaseSelection {
  return {
    ...normalizeAwakenerDatabaseSelection(),
    soulforgeLevel: 0,
  }
}

export function normalizeAwakenerDatabaseSelectionForRecord(
  record: AwakenerFullRecord,
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
    gnosticPotentialLevel: normalizeGnosticPotentialLevelForRecord(
      record,
      normalized.gnosticPotentialLevel,
    ),
  }
}

export function patchAwakenerDatabaseSelection(
  record: AwakenerFullRecord,
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
  record: AwakenerFullRecord,
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
  const gnosticPrimaryStatBonuses = resolveGnosticPotentialPrimaryStatBonuses(
    record,
    normalizedSelection.gnosticPotentialLevel,
  )
  const stats = resolveAwakenerStatsForLevel(
    record,
    normalizedSelection.awakenerLevel,
    normalizedSelection.psycheSurgeOffset,
    soulforgePrimaryStatBonusPercent,
    gnosticPrimaryStatBonuses,
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
      gnosticPotentialLevel: normalizedSelection.gnosticPotentialLevel,
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
  record: AwakenerFullRecord,
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

const GNOSTIC_PRIMARY_STAT_ARG_KEYS = {
  CON: 'Talent_Attr_Lv_physique',
  ATK: 'Talent_Attr_Lv_atk',
  DEF: 'Talent_Attr_Lv_def',
} as const

function resolveGnosticPotentialPrimaryStatBonuses(
  record: AwakenerFullRecord,
  gnosticPotentialLevel: number,
): Partial<Record<'CON' | 'ATK' | 'DEF', number>> {
  if (gnosticPotentialLevel <= 0) {
    return {}
  }

  const gnosticTalent = getGnosticPotentialTalents(record.talents).at(0)
  if (!gnosticTalent) {
    return {}
  }

  const resolvedValue = Object.hasOwn(gnosticTalent.descriptionArgs, 'Arg1')
    ? resolveDescriptionArg(gnosticTalent.descriptionArgs.Arg1, {
        rank: gnosticPotentialLevel,
      }).totalValue
    : undefined

  return Object.fromEntries(
    Object.keys(GNOSTIC_PRIMARY_STAT_ARG_KEYS).map((statKey) => [statKey, resolvedValue ?? 0]),
  )
}
