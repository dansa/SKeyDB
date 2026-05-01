import {z} from 'zod'

export const publicV2Scopes = [
  'awakener-builds',
  'awakeners',
  'covenants',
  'derived-skills',
  'enlightens',
  'overlays',
  'posses',
  'relics',
  'skills',
  'talents',
  'wheels',
] as const

export type PublicV2Scope = (typeof publicV2Scopes)[number]

const forbiddenPublicRecordKeys = new Set([
  'audit',
  'codecIndex',
  'debug',
  'legacyId',
  'rawFormula',
  'slug',
  'source',
  'sourceAwakenerId',
  'sourceConfigId',
  'sourceFormulaVariables',
  'sourceId',
  'sourceSkillId',
  'sourceTables',
  'stateLayerBonus',
])

const canonicalIdPatterns: Partial<Record<PublicV2Scope, RegExp>> = {
  'awakener-builds': /^awakener-build-\d{4}$/,
  awakeners: /^awakener-\d{4}$/,
  covenants: /^covenant-\d{4}$/,
  posses: /^posse-\d{4}$/,
  relics: /^relic-\d{4}$/,
  wheels: /^wheel-\d{4}$/,
}

const awakenerIdSchema = z.string().regex(/^awakener-\d{4}$/)
const wheelIdSchema = z.string().regex(/^wheel-\d{4}$/)
const covenantIdSchema = z.string().regex(/^covenant-\d{4}$/)
const posseIdSchema = z.string().regex(/^posse-\d{4}$/)

const jsonSchema: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(z.string(), jsonSchema),
  ]),
)

function scanForbiddenPublicKeys(
  value: unknown,
  context: z.RefinementCtx,
  path: (string | number)[] = [],
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      scanForbiddenPublicKeys(item, context, [...path, index])
    })
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childPath = [...path, key]

    if (forbiddenPublicRecordKeys.has(key)) {
      context.addIssue({
        code: 'custom',
        message: `Public V2 record contains forbidden private key: ${key}`,
        path: childPath,
      })
    }

    scanForbiddenPublicKeys(childValue, context, childPath)
  }
}

function createRecordSchema(scope: PublicV2Scope) {
  const idPattern = canonicalIdPatterns[scope]

  return z
    .object({
      id: idPattern ? z.string().regex(idPattern) : z.string().min(1),
      awakenerId: awakenerIdSchema.optional(),
      ownerAwakenerId: awakenerIdSchema.optional(),
      recommendedCovenantIds: z.array(covenantIdSchema).optional(),
      recommendedPosseIds: z.array(posseIdSchema).optional(),
      recommendedWheelIds: z.array(wheelIdSchema).optional(),
      builds: z
        .array(
          z
            .object({
              recommendedCovenantIds: z.array(covenantIdSchema).optional(),
              recommendedPosseIds: z.array(posseIdSchema).optional(),
              recommendedWheels: z
                .array(
                  z
                    .object({
                      wheelIds: z.array(wheelIdSchema),
                    })
                    .catchall(jsonSchema),
                )
                .optional(),
            })
            .catchall(jsonSchema),
        )
        .optional(),
    })
    .catchall(jsonSchema)
    .superRefine((record, context) => {
      scanForbiddenPublicKeys(record, context)
    })
}

export const publicV2RecordSchemas = Object.fromEntries(
  publicV2Scopes.map((scope) => [scope, createRecordSchema(scope)]),
) as Record<PublicV2Scope, ReturnType<typeof createRecordSchema>>

export type PublicV2Record<TScope extends PublicV2Scope = PublicV2Scope> = z.infer<
  (typeof publicV2RecordSchemas)[TScope]
>

export interface PublicV2Envelope<TScope extends PublicV2Scope = PublicV2Scope> {
  schemaVersion: number
  scope: TScope
  generatedAt?: string
  recordCount: number
  records: PublicV2Record<TScope>[]
}

export const publicV2EnvelopeSchemas = Object.fromEntries(
  publicV2Scopes.map((scope) => [
    scope,
    z
      .object({
        schemaVersion: z.number().int().positive(),
        scope: z.literal(scope),
        generatedAt: z.string().optional(),
        recordCount: z.number().int().nonnegative(),
        records: z.array(publicV2RecordSchemas[scope]),
      })
      .strict()
      .refine((envelope) => envelope.recordCount === envelope.records.length, {
        message: 'recordCount must match records.length',
        path: ['recordCount'],
      }),
  ]),
) as Record<PublicV2Scope, z.ZodType<PublicV2Envelope>>

export function parsePublicV2Envelope<TScope extends PublicV2Scope>(
  scope: TScope,
  value: unknown,
): PublicV2Envelope<TScope> {
  return publicV2EnvelopeSchemas[scope].parse(value) as PublicV2Envelope<TScope>
}

export function parsePublicV2Record<TScope extends PublicV2Scope>(
  scope: TScope,
  value: unknown,
): PublicV2Record<TScope> {
  return publicV2RecordSchemas[scope].parse(value)
}

const relationshipTargets = {
  awakenerId: 'awakeners',
  ownerAwakenerId: 'awakeners',
  recommendedCovenantIds: 'covenants',
  recommendedPosseIds: 'posses',
  recommendedWheelIds: 'wheels',
} as const satisfies Record<string, PublicV2Scope>

type RelationshipTargetKey = keyof typeof relationshipTargets

function collectRelationshipIds(record: PublicV2Record, key: RelationshipTargetKey): string[] {
  const value = record[key]
  const values: string[] = []

  if (typeof value === 'string') {
    values.push(value)
  } else if (Array.isArray(value)) {
    values.push(...value.filter((item): item is string => typeof item === 'string'))
  }

  if (Array.isArray(record.builds)) {
    for (const build of record.builds) {
      const buildValue = build[key]

      if (Array.isArray(buildValue)) {
        values.push(...buildValue.filter((item): item is string => typeof item === 'string'))
      }

      if (key === 'recommendedWheelIds' && Array.isArray(build.recommendedWheels)) {
        for (const wheelGroup of build.recommendedWheels) {
          values.push(...wheelGroup.wheelIds)
        }
      }
    }
  }

  return values
}

export function validatePublicV2Relationships(envelopes: PublicV2Envelope[]): void {
  const idsByScope = new Map<PublicV2Scope, Set<string>>()

  for (const envelope of envelopes) {
    idsByScope.set(envelope.scope, new Set(envelope.records.map((record) => record.id)))
  }

  const issues: string[] = []

  for (const envelope of envelopes) {
    for (const record of envelope.records) {
      for (const [key, targetScope] of Object.entries(relationshipTargets) as [
        RelationshipTargetKey,
        PublicV2Scope,
      ][]) {
        const targetIds = idsByScope.get(targetScope)

        if (!targetIds) {
          continue
        }

        for (const id of collectRelationshipIds(record, key)) {
          if (!targetIds.has(id)) {
            issues.push(
              `${envelope.scope}/${record.id} ${key} references missing ${targetScope}/${id}`,
            )
          }
        }
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(`Public V2 relationship validation failed:\n${issues.join('\n')}`)
  }
}
