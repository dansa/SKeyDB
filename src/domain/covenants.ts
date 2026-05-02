import {z} from 'zod'

import publicCovenantsLite from '@/data/public-v2/lite/covenants.json'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicCovenantsLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('covenants'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^covenant-\d{4}$/),
        assetId: nonEmptyStringSchema.regex(/^covenant-icon-\d{3}$/),
        name: nonEmptyStringSchema,
        lineupToken: nonEmptyStringSchema,
      }),
    ),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export interface Covenant {
  id: string
  assetId: string
  name: string
  lineupToken: string
}

const parsedCovenants = publicCovenantsLiteSchema.parse(publicCovenantsLite).records.map(
  (covenant): Covenant => ({
    id: covenant.id,
    assetId: covenant.assetId,
    name: covenant.name,
    lineupToken: covenant.lineupToken,
  }),
)

export function getCovenants(): Covenant[] {
  return parsedCovenants
}
