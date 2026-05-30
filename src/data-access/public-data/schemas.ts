import {z} from 'zod'

import {ENTITY_KINDS, PUBLIC_DATA_SCOPES} from './contract'

const nonEmptyStringSchema = z.string().trim().min(1)

export const publicDataScopeSchema = z.enum(PUBLIC_DATA_SCOPES)
export const entityKindSchema = z.enum(ENTITY_KINDS)

export const entityRefSchema = z.strictObject({
  kind: entityKindSchema,
  id: nonEmptyStringSchema,
})

export const publicRouteInfoSchema = z.strictObject({
  slug: nonEmptyStringSchema,
  canonicalPath: nonEmptyStringSchema,
})

const assetMapSchema = z.record(nonEmptyStringSchema, nonEmptyStringSchema)

export const publicCatalogRecordSchema = z.looseObject({
  kind: entityKindSchema,
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  route: publicRouteInfoSchema,
  assets: assetMapSchema.optional(),
})

export const publicCatalogSchema = z
  .strictObject({
    schemaVersion: z.literal(3),
    scope: publicDataScopeSchema,
    kind: entityKindSchema,
    recordCount: z.number().int().nonnegative(),
    records: z.array(publicCatalogRecordSchema),
  })
  .refine((catalog) => catalog.recordCount === catalog.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export const publicRecordSchema = z.looseObject({
  schemaVersion: z.literal(3),
  kind: entityKindSchema,
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  route: publicRouteInfoSchema.optional(),
  assets: assetMapSchema.optional(),
})

const manifestScopeSchema = z.strictObject({
  kind: entityKindSchema,
  catalog: nonEmptyStringSchema,
  recordPattern: nonEmptyStringSchema,
  count: z.number().int().nonnegative(),
})

const publicScopeCapabilitySchema = z.enum(['catalog', 'detailRecord', 'search', 'snapshot'])

export const publicScopeMetadataSchema = z.strictObject({
  scope: publicDataScopeSchema,
  kind: entityKindSchema,
  idPrefix: nonEmptyStringSchema,
  capabilities: z.array(publicScopeCapabilitySchema),
  searchable: z.boolean(),
  recordCount: z.number().int().nonnegative(),
})

export const publicScopesIndexSchema = z
  .strictObject({
    schemaVersion: z.literal(3),
    records: z.array(publicScopeMetadataSchema),
    byScope: z.record(publicDataScopeSchema, publicScopeMetadataSchema),
  })
  .superRefine((index, ctx) => {
    for (const scope of PUBLIC_DATA_SCOPES) {
      const scopedRecord = index.byScope[scope]
      if (scopedRecord.scope !== scope) {
        ctx.addIssue({
          code: 'custom',
          message: `Generated public scope metadata key "${scope}" contains scope "${scopedRecord.scope}".`,
          path: ['byScope', scope, 'scope'],
        })
      }
    }
  })

export const publicManifestSchema = z.looseObject({
  schemaVersion: z.literal(3),
  gameDataVersion: nonEmptyStringSchema,
  generatedAt: nonEmptyStringSchema,
  buildId: nonEmptyStringSchema,
  scopes: z.record(publicDataScopeSchema, manifestScopeSchema),
  indexes: z.record(nonEmptyStringSchema, nonEmptyStringSchema),
  metadata: z.record(nonEmptyStringSchema, nonEmptyStringSchema).optional(),
  files: z
    .record(
      nonEmptyStringSchema,
      z.strictObject({
        bytes: z.number().int().nonnegative(),
        sha256: nonEmptyStringSchema,
      }),
    )
    .optional(),
})

export const publicEntitySummarySchema = z.looseObject({
  kind: entityKindSchema,
  id: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  route: publicRouteInfoSchema.optional(),
  assets: assetMapSchema.optional(),
})

export const publicEntitiesIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  byId: z.record(nonEmptyStringSchema, publicEntitySummarySchema),
  scopes: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
})

export const publicRouteIndexEntrySchema = entityRefSchema.extend({
  canonicalSlug: nonEmptyStringSchema,
  canonicalPath: nonEmptyStringSchema,
})

export const publicRoutesIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  routes: z.partialRecord(
    publicDataScopeSchema,
    z.record(nonEmptyStringSchema, publicRouteIndexEntrySchema),
  ),
  redirects: z.partialRecord(
    publicDataScopeSchema,
    z.record(nonEmptyStringSchema, publicRouteIndexEntrySchema),
  ),
})

export const publicAssetRecordSchema = z.looseObject({
  id: nonEmptyStringSchema,
  slot: nonEmptyStringSchema,
  kind: entityKindSchema,
  ownerId: nonEmptyStringSchema,
  assetId: nonEmptyStringSchema.optional(),
  availability: z.looseObject({
    status: nonEmptyStringSchema,
    path: nonEmptyStringSchema.optional(),
    candidates: z.array(nonEmptyStringSchema).optional(),
  }),
})

export const publicAssetsIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  assets: z.record(nonEmptyStringSchema, publicAssetRecordSchema),
  entities: z.record(nonEmptyStringSchema, z.record(nonEmptyStringSchema, nonEmptyStringSchema)),
})

export const publicReferencesIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  tokens: z.record(nonEmptyStringSchema, z.array(entityRefSchema)),
  ambiguous: z.record(nonEmptyStringSchema, z.array(entityRefSchema)),
})

export const publicRelationshipsIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  forward: z.record(
    nonEmptyStringSchema,
    z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
  ),
  reverse: z.record(
    nonEmptyStringSchema,
    z.record(nonEmptyStringSchema, z.union([nonEmptyStringSchema, z.array(nonEmptyStringSchema)])),
  ),
})

export const publicSearchDocumentSchema = entityRefSchema.extend({
  name: nonEmptyStringSchema,
  aliases: z.array(nonEmptyStringSchema),
  tokens: z.array(nonEmptyStringSchema),
  fields: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
  facets: z.record(nonEmptyStringSchema, z.unknown()).optional(),
})

export const publicSearchIndexSchema = z.strictObject({
  schemaVersion: z.literal(3),
  scope: publicDataScopeSchema,
  records: z.array(publicSearchDocumentSchema),
})

export const publicBuilderCatalogSchema = z.strictObject({
  schemaVersion: z.literal(3),
  options: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
  lineupTokens: z.record(nonEmptyStringSchema, nonEmptyStringSchema),
  groups: z.record(nonEmptyStringSchema, z.unknown()),
})

export const publicCollectionCatalogSchema = z.strictObject({
  schemaVersion: z.literal(3),
  collectables: z.record(nonEmptyStringSchema, z.array(nonEmptyStringSchema)),
  content: z.record(nonEmptyStringSchema, z.unknown()),
  groups: z.record(nonEmptyStringSchema, z.unknown()),
})
