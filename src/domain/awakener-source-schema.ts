import {z} from 'zod'

import {AWAKENER_TEXT_COLOR_NAMES} from './awakeners-text-colors.ts'

const nonEmptyStringSchema = z.string().trim().min(1)

export const SUBSTAT_SCALING_KEYS = [
  'CritRate',
  'CritDamage',
  'AliemusRegen',
  'KeyflareRegen',
  'RealmMastery',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const

export const ENLIGHTEN_SLOT_KEYS = ['E1', 'E2', 'E3', 'OverExalt', 'AbsoluteAxiom'] as const
export const SCALING_ARG_STAT_KEYS = ['ATK', 'DEF', 'CON'] as const

export const fullStatsSchema = z.object({
  CON: nonEmptyStringSchema,
  ATK: nonEmptyStringSchema,
  DEF: nonEmptyStringSchema,
  CritRate: nonEmptyStringSchema,
  CritDamage: nonEmptyStringSchema,
  AliemusRegen: nonEmptyStringSchema,
  KeyflareRegen: nonEmptyStringSchema,
  RealmMastery: nonEmptyStringSchema,
  SigilYield: nonEmptyStringSchema,
  DamageAmplification: nonEmptyStringSchema,
  DeathResistance: nonEmptyStringSchema,
})

export const primaryScalingBaseSchema = z.union([z.literal(20), z.literal(30)])

export const statScalingSchema = z.object({
  CON: z.number().nonnegative(),
  ATK: z.number().nonnegative(),
  DEF: z.number().nonnegative(),
})

export const substatScalingSchema = z.partialRecord(
  z.enum(SUBSTAT_SCALING_KEYS),
  nonEmptyStringSchema,
)

export const descriptionArgSubstatBonusSchema = z.object({
  substat: z.enum(SUBSTAT_SCALING_KEYS),
  multiplier: nonEmptyStringSchema,
  suffix: nonEmptyStringSchema.optional(),
  mode: z.enum(['additive', 'scale_base', 'additive_factor']).optional(),
  baseMultiplier: nonEmptyStringSchema.optional(),
})

export const descriptionArgSubstatBonusesSchema = z.record(
  nonEmptyStringSchema,
  descriptionArgSubstatBonusSchema,
)

const descriptionArgChannelSchema = nonEmptyStringSchema
const publicFormulaKeySchema = z.enum(['accountLevel', 'ownedPosseCount', 'wheelRefinementLevel'])
const publicScaledBaseFormulaSchema = z.enum([
  'accountStageGrowth',
  'somaticResearchHpMultiplier',
  'esotericResearchDepth',
  'occultResearchDepth',
])

export const descriptionArgSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('fixed'),
      value: nonEmptyStringSchema.optional(),
      displayFormula: nonEmptyStringSchema.optional(),
      channel: descriptionArgChannelSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: z.enum(SCALING_ARG_STAT_KEYS).optional(),
      substatBonus: descriptionArgSubstatBonusSchema.optional(),
    })
    .superRefine((arg, ctx) => {
      if (arg.value || arg.substatBonus) {
        return
      }
      ctx.addIssue({
        code: 'custom',
        message: 'fixed args require value or substatBonus.',
        path: ['value'],
      })
    }),
  z
    .object({
      kind: z.literal('linear'),
      base: nonEmptyStringSchema,
      gainPerLevel: nonEmptyStringSchema,
      channel: descriptionArgChannelSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: z.enum(SCALING_ARG_STAT_KEYS).optional(),
      substatBonus: descriptionArgSubstatBonusSchema.optional(),
    })
    .catchall(z.unknown()),
  z
    .object({
      kind: z.literal('scaling'),
      values: z.array(nonEmptyStringSchema).min(1),
      channel: descriptionArgChannelSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: z.enum(SCALING_ARG_STAT_KEYS).optional(),
      substatBonus: descriptionArgSubstatBonusSchema.optional(),
    })
    .catchall(z.unknown()),
  z.discriminatedUnion('formulaKey', [
    z.object({
      kind: z.literal('computed'),
      formulaKey: z.literal('scaled'),
      baseFormula: publicScaledBaseFormulaSchema,
      multiplier: z.number().optional(),
      rounding: z.literal('ceil').optional(),
      inputs: z.array(publicFormulaKeySchema),
      channel: descriptionArgChannelSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: z.enum(SCALING_ARG_STAT_KEYS).optional(),
      substatBonus: descriptionArgSubstatBonusSchema.optional(),
    }),
    z.object({
      kind: z.literal('computed'),
      formulaKey: z.literal('wheelRefinementLinear'),
      baseValue: z.number(),
      perLevel: z.number(),
      inputs: z.tuple([z.literal('wheelRefinementLevel')]),
      channel: descriptionArgChannelSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: z.enum(SCALING_ARG_STAT_KEYS).optional(),
      substatBonus: descriptionArgSubstatBonusSchema.optional(),
    }),
  ]),
])

export const descriptionArgsSchema = z.record(nonEmptyStringSchema, descriptionArgSchema)

export const describedRecordSchema = z.object({
  descriptionTemplate: nonEmptyStringSchema,
  descriptionArgs: descriptionArgsSchema,
})

export const cardKeywordSchema = z.object({
  id: nonEmptyStringSchema,
  value: z.number().nonnegative().optional(),
})

export const cardKeywordsSchema = z.array(cardKeywordSchema)

export const descriptionContinuationRefSchema = z
  .object({
    sourceType: z.enum(['state', 'overlay', 'other']),
    displayName: nonEmptyStringSchema.optional(),
    sourceField: z.enum(['Name', 'Desc', 'BattleDesc']).optional(),
    literalText: nonEmptyStringSchema.optional(),
    roleScope: z.enum(['owner', 'blank', 'global']).optional(),
  })
  .superRefine((ref, ctx) => {
    if (!ref.displayName && !ref.literalText) {
      ctx.addIssue({
        code: 'custom',
        message: 'Continuation refs require displayName or literalText.',
        path: ['displayName'],
      })
    }
  })

export const enlightenPatchTargetTypeSchema = z.enum(['skill', 'derived-skill', 'overlay'])
export const enlightenPatchOperationSchema = z.enum([
  'replace_description',
  'override_args',
  'arg_substat_bonuses',
  'card_keywords',
  'mixed',
])

export const enlightenPatchSchema = z
  .object({
    targetId: nonEmptyStringSchema,
    targetType: enlightenPatchTargetTypeSchema,
    operation: enlightenPatchOperationSchema,
    descriptionTemplate: nonEmptyStringSchema.optional(),
    descriptionArgs: descriptionArgsSchema.optional(),
    argSubstatBonuses: descriptionArgSubstatBonusesSchema.optional(),
    addCardKeywords: cardKeywordsSchema.optional(),
    removeCardKeywordIds: z.array(nonEmptyStringSchema).optional(),
  })
  .superRefine((patch, ctx) => {
    const hasDescriptionTemplate = typeof patch.descriptionTemplate === 'string'
    const hasDescriptionArgs = patch.descriptionArgs !== undefined
    const hasArgSubstatBonuses = Object.keys(patch.argSubstatBonuses ?? {}).length > 0
    const hasCardKeywordAdds = (patch.addCardKeywords?.length ?? 0) > 0
    const hasCardKeywordRemovals = (patch.removeCardKeywordIds?.length ?? 0) > 0

    if (patch.operation === 'replace_description' && !hasDescriptionTemplate) {
      ctx.addIssue({
        code: 'custom',
        message: 'replace_description patches require descriptionTemplate.',
        path: ['descriptionTemplate'],
      })
    }

    if (patch.operation === 'override_args' && !hasDescriptionArgs) {
      ctx.addIssue({
        code: 'custom',
        message: 'override_args patches require descriptionArgs.',
        path: ['descriptionArgs'],
      })
    }

    if (patch.operation === 'arg_substat_bonuses' && !hasArgSubstatBonuses) {
      ctx.addIssue({
        code: 'custom',
        message: 'arg_substat_bonuses patches require argSubstatBonuses.',
        path: ['argSubstatBonuses'],
      })
    }

    if (patch.operation === 'card_keywords' && !hasCardKeywordAdds && !hasCardKeywordRemovals) {
      ctx.addIssue({
        code: 'custom',
        message: 'card_keywords patches require addCardKeywords or removeCardKeywordIds.',
        path: ['addCardKeywords'],
      })
    }

    if (
      patch.operation === 'mixed' &&
      !hasDescriptionTemplate &&
      !hasDescriptionArgs &&
      !hasArgSubstatBonuses &&
      !hasCardKeywordAdds &&
      !hasCardKeywordRemovals
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'mixed patches require at least one description or card keyword change payload.',
        path: ['operation'],
      })
    }
  })

export const awakenerRosterSchema = z.object({
  id: z.number().int().positive(),
  key: nonEmptyStringSchema,
  displayName: nonEmptyStringSchema,
  ingameId: nonEmptyStringSchema.optional(),
  faction: nonEmptyStringSchema,
  realm: nonEmptyStringSchema,
  rarity: nonEmptyStringSchema.optional(),
  type: nonEmptyStringSchema.optional(),
  aliases: z.array(nonEmptyStringSchema),
  searchTags: z.array(nonEmptyStringSchema).optional(),
  unreleased: z.boolean().optional(),
  stats: fullStatsSchema,
  primaryScalingBase: primaryScalingBaseSchema,
  statScaling: statScalingSchema,
  substatScaling: substatScalingSchema,
  assets: z.object({
    portraitKey: nonEmptyStringSchema,
    iconKey: nonEmptyStringSchema,
  }),
})

export const skillKindSchema = z.enum([
  'strike',
  'defense',
  'command',
  'rouse',
  'exalt',
  'over_exalt',
  'other',
])

export const cardVariantSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  unlockEnlightenSlot: z.enum(ENLIGHTEN_SLOT_KEYS).optional(),
  cost: nonEmptyStringSchema.optional(),
  cardKeywords: cardKeywordsSchema,
})

export const awakenersSkillVariantSchema = cardVariantSchema

export const awakenerSkillSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive(),
  kind: skillKindSchema,
  displayName: nonEmptyStringSchema,
  cost: nonEmptyStringSchema.optional(),
  continuationRefs: z.array(descriptionContinuationRefSchema).optional(),
  cardKeywords: cardKeywordsSchema,
  variants: z.array(awakenersSkillVariantSchema).default([]),
})

export const awakenerTalentSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive(),
  displayName: nonEmptyStringSchema,
  maxLevel: z.number().int().positive().optional(),
  hasLevelScaledDescription: z.boolean().optional(),
})

export const awakenersEnlightenSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive(),
  slot: z.enum(ENLIGHTEN_SLOT_KEYS),
  displayName: nonEmptyStringSchema,
})

export const derivedSkillSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive().optional(),
  nodeKind: z.enum(['card', 'group']).optional(),
  displayName: nonEmptyStringSchema,
  cost: nonEmptyStringSchema.optional(),
  derivedFromId: nonEmptyStringSchema.optional(),
  rootSkillId: nonEmptyStringSchema.optional(),
  childDerivedSkillIds: z.array(nonEmptyStringSchema).default([]),
  cardKeywords: cardKeywordsSchema,
  variants: z.array(cardVariantSchema).default([]),
})

export const overlayTypeSchema = z.enum(['realm', 'mechanic', 'tag', 'help'])

export const awakenerOverlaySchema = z.object({
  id: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive().optional(),
  displayName: nonEmptyStringSchema,
  overlayType: overlayTypeSchema,
  aliases: z.array(nonEmptyStringSchema),
  iconId: nonEmptyStringSchema.optional(),
  textColor: z.enum(AWAKENER_TEXT_COLOR_NAMES).optional(),
  descriptionTemplate: z.string(),
  descriptionArgs: descriptionArgsSchema,
})

export const awakenerKitSchema = z.object({
  awakenerId: z.number().int().positive(),
  cards: z.object({
    C1: nonEmptyStringSchema,
    C2: nonEmptyStringSchema,
    C3: nonEmptyStringSchema,
    C4: nonEmptyStringSchema,
    C5: nonEmptyStringSchema,
    Exalt: nonEmptyStringSchema,
    OverExalt: nonEmptyStringSchema.optional(),
    promotedExtras: z.array(nonEmptyStringSchema),
  }),
  talents: z.object({
    T1: nonEmptyStringSchema.optional(),
    T2: nonEmptyStringSchema.optional(),
    T3: nonEmptyStringSchema.optional(),
    T4: nonEmptyStringSchema.optional(),
    extraTalentIds: z.array(nonEmptyStringSchema),
  }),
  enlightens: z.object({
    E1: nonEmptyStringSchema,
    E2: nonEmptyStringSchema,
    E3: nonEmptyStringSchema,
    OverExalt: nonEmptyStringSchema.optional(),
    AbsoluteAxiom: nonEmptyStringSchema.optional(),
  }),
})

function withUniqueKey<T extends z.ZodType>(
  schema: z.ZodArray<T>,
  keySelector: (value: z.infer<T>) => string | number,
  label: string,
) {
  return schema.superRefine((entries, ctx) => {
    const seenKeys = new Map<string | number, number>()

    entries.forEach((entry, index) => {
      const key = keySelector(entry)
      const existingIndex = seenKeys.get(key)
      if (existingIndex !== undefined) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate ${label} "${String(key)}" also appears at index ${String(existingIndex)}.`,
          path: [index],
        })
        return
      }
      seenKeys.set(key, index)
    })
  })
}

export const awakenerRosterDatasetSchema = withUniqueKey(
  z.array(awakenerRosterSchema),
  (entry) => entry.id,
  'awakener roster id',
)

export const awakenerSkillsDatasetSchema = withUniqueKey(
  z.array(awakenerSkillSchema),
  (entry) => entry.id,
  'skill id',
)

export const awakenerTalentsDatasetSchema = withUniqueKey(
  z.array(awakenerTalentSchema),
  (entry) => entry.id,
  'talent id',
)

export const awakenerEnlightensDatasetSchema = withUniqueKey(
  z.array(awakenersEnlightenSchema),
  (entry) => entry.id,
  'enlighten id',
)

export const derivedSkillsDatasetSchema = withUniqueKey(
  z.array(derivedSkillSchema),
  (entry) => entry.id,
  'derived skill id',
)

export const awakenerOverlaysDatasetSchema = withUniqueKey(
  z.array(awakenerOverlaySchema),
  (entry) => entry.id,
  'overlay id',
)

export const awakenerKitsDatasetSchema = withUniqueKey(
  z.array(awakenerKitSchema),
  (entry) => entry.awakenerId,
  'awakener kit id',
)

export type DescriptionArg = z.infer<typeof descriptionArgSchema>
export type CardKeyword = z.infer<typeof cardKeywordSchema>
export type DescriptionContinuationRef = z.infer<typeof descriptionContinuationRefSchema>
export type UpgradePatch = z.infer<typeof enlightenPatchSchema>
export type EnlightenPatch = z.infer<typeof enlightenPatchSchema>
export type FullStats = z.infer<typeof fullStatsSchema>
export type PrimaryScalingBase = z.infer<typeof primaryScalingBaseSchema>
export type StatScaling = z.infer<typeof statScalingSchema>
export type SubstatScalingKey = (typeof SUBSTAT_SCALING_KEYS)[number]
export type SubstatScaling = z.infer<typeof substatScalingSchema>
export type AwakenerRosterRecord = z.infer<typeof awakenerRosterSchema>
export type AwakenerSkillRecord = z.infer<typeof awakenerSkillSchema>
export type AwakenerSkillVariantRecord = z.infer<typeof awakenersSkillVariantSchema>
export type AwakenerTalentRecord = z.infer<typeof awakenerTalentSchema>
export type AwakenerEnlightenRecord = z.infer<typeof awakenersEnlightenSchema>
export type DerivedSkillRecord = z.infer<typeof derivedSkillSchema>
export type AwakenerOverlayRecord = z.infer<typeof awakenerOverlaySchema>
export type AwakenerKitRecord = z.infer<typeof awakenerKitSchema>
