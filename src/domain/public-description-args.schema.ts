import {z} from 'zod'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicFormulaKeySchema = z.enum([
  'accountLevel',
  'ownedPosseCount',
  'wheelRefinementLevel',
  'realmMasteryFinal',
  'primordiaAllChaosTeam',
])

const publicScaledBaseFormulaSchema = z.enum([
  'accountStageGrowth',
  'somaticResearchHpMultiplier',
  'esotericResearchDepth',
  'occultResearchDepth',
  'occultResearchMultiplier',
])

const publicDescriptionArgStatSchema = z.enum(['ATK', 'DEF', 'CON'])

const publicDescriptionArgSubstatBonusSchema = z.strictObject({
  substat: nonEmptyStringSchema,
  multiplier: nonEmptyStringSchema,
  suffix: nonEmptyStringSchema.optional(),
  mode: z.enum(['additive', 'scale_base', 'additive_factor']).optional(),
  baseMultiplier: nonEmptyStringSchema.optional(),
})

export const publicDescriptionArgSchema = z.discriminatedUnion('kind', [
  z
    .strictObject({
      kind: z.literal('fixed'),
      value: nonEmptyStringSchema.optional(),
      displayFormula: nonEmptyStringSchema.optional(),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    })
    .superRefine((arg, ctx) => {
      if (arg.value || arg.displayFormula || arg.substatBonus) {
        return
      }
      ctx.addIssue({
        code: 'custom',
        message: 'fixed args require value, displayFormula, or substatBonus.',
        path: ['value'],
      })
    }),
  z.strictObject({
    kind: z.literal('linear'),
    base: nonEmptyStringSchema,
    gainPerLevel: nonEmptyStringSchema,
    channel: nonEmptyStringSchema.optional(),
    suffix: nonEmptyStringSchema.optional(),
    stat: publicDescriptionArgStatSchema.optional(),
    substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
  }),
  z.strictObject({
    kind: z.literal('scaling'),
    values: z.array(nonEmptyStringSchema).min(1),
    scalingContext: z.literal('wheelRefinement').optional(),
    channel: nonEmptyStringSchema.optional(),
    suffix: nonEmptyStringSchema.optional(),
    stat: publicDescriptionArgStatSchema.optional(),
    substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
  }),
  z.discriminatedUnion('formulaKey', [
    z.strictObject({
      kind: z.literal('computed'),
      formulaKey: z.literal('scaled'),
      baseFormula: publicScaledBaseFormulaSchema,
      multiplier: z.number().optional(),
      rounding: z.literal('ceil').optional(),
      inputs: z.array(publicFormulaKeySchema).min(1),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    }),
    z.strictObject({
      kind: z.literal('computed'),
      formulaKey: z.literal('scaledCeilThenMultiply'),
      baseFormula: publicScaledBaseFormulaSchema,
      multiplier: z.number(),
      divisor: z.number().positive().optional(),
      postMultiplier: z.number(),
      inputs: z.array(publicFormulaKeySchema).min(1),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    }),
    z.strictObject({
      kind: z.literal('computed'),
      formulaKey: z.literal('wheelRefinementLinear'),
      baseValue: z.number(),
      perLevel: z.number(),
      inputs: z.tuple([z.literal('wheelRefinementLevel')]),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    }),
    z.strictObject({
      kind: z.literal('computed'),
      formulaKey: z.literal('realmMasteryLinear'),
      baseValue: z.number(),
      perPoint: z.number(),
      rounding: z.literal('ceil').optional(),
      inputs: z.tuple([z.literal('realmMasteryFinal')]),
      channel: nonEmptyStringSchema.optional(),
      suffix: nonEmptyStringSchema.optional(),
      stat: publicDescriptionArgStatSchema.optional(),
      substatBonus: publicDescriptionArgSubstatBonusSchema.optional(),
    }),
    z
      .strictObject({
        kind: z.literal('computed'),
        formulaKey: z.literal('primordiaPosseScaled'),
        baseFormula: z.union([z.literal('fixed'), publicScaledBaseFormulaSchema]),
        baseValue: z.number().optional(),
        multiplier: z.number().optional(),
        scalingBucket: z.enum(['utility', 'offensive']),
        rounding: z.literal('ceil'),
        inputs: z.array(publicFormulaKeySchema).min(2),
        channel: nonEmptyStringSchema.optional(),
        suffix: nonEmptyStringSchema.optional(),
        stat: publicDescriptionArgStatSchema.optional(),
      })
      .superRefine((arg, ctx) => {
        if (arg.baseFormula !== 'fixed' || typeof arg.baseValue === 'number') return
        ctx.addIssue({
          code: 'custom',
          message: 'Fixed Primordia bases require baseValue.',
          path: ['baseValue'],
        })
      }),
  ]),
])

export const publicDescriptionArgsSchema = z.record(
  nonEmptyStringSchema,
  publicDescriptionArgSchema,
)

export type PublicFormulaKey = z.infer<typeof publicFormulaKeySchema>
export type PublicScaledBaseFormula = z.infer<typeof publicScaledBaseFormulaSchema>
export type PublicDescriptionArgStat = z.infer<typeof publicDescriptionArgStatSchema>
export type PublicDescriptionArgSubstatBonus = z.infer<
  typeof publicDescriptionArgSubstatBonusSchema
>
export type PublicDescriptionArg = z.infer<typeof publicDescriptionArgSchema>
export type PublicFixedDescriptionArg = Extract<PublicDescriptionArg, {kind: 'fixed'}>
export type PublicLinearDescriptionArg = Extract<PublicDescriptionArg, {kind: 'linear'}>
export type PublicScalingDescriptionArg = Extract<PublicDescriptionArg, {kind: 'scaling'}>
export type PublicComputedDescriptionArg = Extract<PublicDescriptionArg, {kind: 'computed'}>
export type PublicScaledComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'scaled'}
>
export type PublicScaledCeilThenMultiplyComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'scaledCeilThenMultiply'}
>
export type PublicScaledFormulaDescriptionArg =
  | PublicScaledComputedDescriptionArg
  | PublicScaledCeilThenMultiplyComputedDescriptionArg
export type PublicWheelRefinementLinearComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'wheelRefinementLinear'}
>
export type PublicRealmMasteryLinearComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'realmMasteryLinear'}
>
export type PublicPrimordiaPosseScaledComputedDescriptionArg = Extract<
  PublicComputedDescriptionArg,
  {formulaKey: 'primordiaPosseScaled'}
>
