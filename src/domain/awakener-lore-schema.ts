import {z} from 'zod'

import type {AwakenerProfile, AwakenerQuote} from './awakeners-full'

export const awakenerQuoteSchema: z.ZodType<AwakenerQuote> = z.looseObject({
  id: z.string().min(1),
  title: z.string(),
  content: z.string(),
  unlockCondition: z.string().optional(),
  exchange: z
    .array(
      z.object({
        awakenerId: z.string().regex(/^awakener-\d{4}$/),
        lineId: z.string().min(1),
      }),
    )
    .min(1)
    .optional(),
})

export const awakenerProfileSchema: z.ZodType<AwakenerProfile> = z.looseObject({
  title: z.string().optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  gnosticIndex: z.string().optional(),
  faction: z.string().optional(),
  storySections: z
    .array(
      z.looseObject({
        kind: z.enum(['introduction', 'story']),
        title: z.string(),
        unlockCondition: z.string().optional(),
        content: z.string(),
      }),
    )
    .optional(),
  voiceLines: z
    .object({
      daily: z.array(awakenerQuoteSchema).optional(),
      battle: z.array(awakenerQuoteSchema).optional(),
      traphase: z.array(awakenerQuoteSchema).optional(),
    })
    .optional(),
})
