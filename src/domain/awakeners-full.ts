import {z} from 'zod'

const cardSchema = z.object({
  name: z.string(),
  cost: z.string(),
  description: z.string(),
  label: z.string().optional(),
})

const exaltSchema = z.object({
  name: z.string(),
  description: z.string(),
  label: z.string().optional(),
})

const talentSchema = z.object({
  name: z.string(),
  description: z.string(),
  label: z.string().optional(),
})

const enlightenSchema = z.object({
  name: z.string(),
  description: z.string(),
  label: z.string().optional(),
})

const statScalingSchema = z.object({
  CON: z.number(),
  ATK: z.number(),
  DEF: z.number(),
})
const primaryScalingBaseSchema = z.union([z.literal(20), z.literal(30)])

const SUBSTAT_SCALING_KEYS = [
  'CritRate',
  'CritDamage',
  'AliemusRegen',
  'KeyflareRegen',
  'RealmMastery',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
] as const

const substatScalingSchema = z.partialRecord(z.enum(SUBSTAT_SCALING_KEYS), z.string())

const fullStatsSchema = z.object({
  CON: z.string(),
  ATK: z.string(),
  DEF: z.string(),
  CritRate: z.string(),
  CritDamage: z.string(),
  AliemusRegen: z.string(),
  KeyflareRegen: z.string(),
  RealmMastery: z.string(),
  SigilYield: z.string(),
  DamageAmplification: z.string(),
  DeathResistance: z.string(),
  BaseAliemus: z.string(),
})

const awakenerFullSchema = z.array(
  z.object({
    id: z.number().int().positive(),
    name: z.string(),
    ingameId: z.string().trim().min(1).optional(),
    stats: fullStatsSchema,
    primaryScalingBase: primaryScalingBaseSchema,
    statScaling: statScalingSchema,
    substatScaling: substatScalingSchema,
    cards: z.record(z.string(), cardSchema),
    exalts: z.object({
      exalt: exaltSchema,
      over_exalt: exaltSchema,
    }),
    talents: z.record(z.string(), talentSchema),
    enlightens: z.record(z.string(), enlightenSchema),
  }),
)

export type AwakenerCard = z.infer<typeof cardSchema>
export type AwakenerExalt = z.infer<typeof exaltSchema>
export type AwakenerTalent = z.infer<typeof talentSchema>
export type AwakenerEnlighten = z.infer<typeof enlightenSchema>
export type AwakenerFullStats = z.infer<typeof fullStatsSchema>
export type AwakenerPrimaryScalingBase = z.infer<typeof primaryScalingBaseSchema>
export type AwakenerStatScaling = z.infer<typeof statScalingSchema>
export type AwakenerSubstatScalingKey = (typeof SUBSTAT_SCALING_KEYS)[number]
export type AwakenerSubstatScaling = z.infer<typeof substatScalingSchema>
export type AwakenerFull = z.infer<typeof awakenerFullSchema>[number]

let fullDataCache: AwakenerFull[] | null = null

export async function loadAwakenersFull(): Promise<AwakenerFull[]> {
  if (fullDataCache) {
    return fullDataCache
  }
  const module = await import('@/data/awakeners-full.json')
  fullDataCache = awakenerFullSchema.parse(module.default)
  return fullDataCache
}

export function getAwakenerFullById(id: number, data: AwakenerFull[]): AwakenerFull | undefined {
  return data.find((entry) => entry.id === id)
}
