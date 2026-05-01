import {describe, expect, it} from 'vitest'

import {
  parsePublicV2Envelope,
  parsePublicV2Record,
  publicV2Scopes,
  validatePublicV2Relationships,
  type PublicV2Scope,
} from './public-v2-schema'

const aggregateModules = import.meta.glob('../data/public-v2/{full,lite}/*.json', {
  eager: true,
  import: 'default',
})

const fullRecordModules = import.meta.glob('../data/public-v2/full/*-records/*.json', {
  eager: true,
  import: 'default',
})

function parseAggregatePath(path: string): {kind: 'full' | 'lite'; scope: PublicV2Scope} {
  const match = /public-v2\/(full|lite)\/(.+)\.json$/.exec(path)
  if (!match) {
    throw new Error(`Unexpected public V2 aggregate path: ${path}`)
  }

  return {kind: match[1] as 'full' | 'lite', scope: match[2] as PublicV2Scope}
}

function parseRecordPath(path: string): {scope: PublicV2Scope; recordId: string} {
  const match = /public-v2\/full\/(.+)-records\/(.+)\.json$/.exec(path)
  if (!match) {
    throw new Error(`Unexpected public V2 record path: ${path}`)
  }

  return {scope: match[1] as PublicV2Scope, recordId: match[2]}
}

describe('public-v2-schema', () => {
  it('parses every synced lite and full aggregate envelope', () => {
    const seen = new Set<string>()

    for (const [path, module] of Object.entries(aggregateModules)) {
      const {kind, scope} = parseAggregatePath(path)
      const envelope = parsePublicV2Envelope(scope, module)

      expect(envelope.scope).toBe(scope)
      expect(envelope.recordCount).toBe(envelope.records.length)
      seen.add(`${kind}/${scope}`)
    }

    for (const scope of publicV2Scopes) {
      expect(seen.has(`full/${scope}`)).toBe(true)
      expect(seen.has(`lite/${scope}`)).toBe(true)
    }
  })

  it('validates relationship existence across synced full envelopes', () => {
    const envelopes = publicV2Scopes.map((scope) =>
      parsePublicV2Envelope(scope, aggregateModules[`../data/public-v2/full/${scope}.json`]),
    )

    expect(() => {
      validatePublicV2Relationships(envelopes)
    }).not.toThrow()
  })

  it('parses synced per-record chunks and keeps filenames aligned to ids', () => {
    const seenScopes = new Set<PublicV2Scope>()

    for (const [path, module] of Object.entries(fullRecordModules)) {
      const {scope, recordId} = parseRecordPath(path)
      const record = parsePublicV2Record(scope, module)

      expect(record.id).toBe(recordId)
      seenScopes.add(scope)
    }

    expect(seenScopes).toEqual(new Set(publicV2Scopes))
  })

  it('rejects private or source-shaped keys on public root records', () => {
    expect(() =>
      parsePublicV2Record('awakeners', {
        id: 'awakener-0001',
        sourceId: 'C06',
      }),
    ).toThrow(/forbidden private key/)
  })

  it('rejects private or source-shaped keys nested inside public records', () => {
    expect(() =>
      parsePublicV2Record('awakener-builds', {
        id: 'awakener-build-0001',
        awakenerId: 'awakener-0001',
        builds: [
          {
            id: 'dps',
            recommendedWheels: [{tier: 'GOOD', wheelIds: ['wheel-0001'], audit: {sourceId: 123}}],
          },
        ],
      }),
    ).toThrow(/forbidden private key: audit/)

    expect(() =>
      parsePublicV2Record('skills', {
        id: 'skill.example',
        args: [{name: 'damage', rawFormula: 'GetAccountStageGrow()'}],
      }),
    ).toThrow(/forbidden private key: rawFormula/)

    for (const key of [
      'source',
      'sourceSkillId',
      'sourceTables',
      'sourceAwakenerId',
      'sourceFormulaVariables',
      'stateLayerBonus',
    ]) {
      expect(() =>
        parsePublicV2Record('skills', {
          id: 'skill.example',
          nested: {[key]: 'private'},
        }),
      ).toThrow(new RegExp(`forbidden private key: ${key}`))
    }
  })

  it('validates canonical public ids and relationship refs where present', () => {
    expect(() => parsePublicV2Record('wheels', {id: 'legacy-wheel'})).toThrow()
    expect(() =>
      parsePublicV2Record('awakener-builds', {
        id: 'awakener-build-0001',
        awakenerId: 'C06',
        recommendedWheelIds: ['wheel-0001'],
      }),
    ).toThrow()
    expect(() =>
      parsePublicV2Record('awakener-builds', {
        id: 'awakener-build-0001',
        awakenerId: 'awakener-0001',
        builds: [
          {
            id: 'dps',
            recommendedWheels: [{tier: 'GOOD', wheelIds: ['wheel-legacy']}],
            recommendedCovenantIds: ['covenant-0001'],
            recommendedPosseIds: ['posse-0001'],
          },
        ],
      }),
    ).toThrow()
  })

  it('validates relationship existence across loaded envelopes', () => {
    const awakenerBuilds = parsePublicV2Envelope('awakener-builds', {
      schemaVersion: 1,
      scope: 'awakener-builds',
      recordCount: 1,
      records: [
        {
          id: 'awakener-build-0001',
          awakenerId: 'awakener-0001',
          builds: [
            {
              id: 'dps',
              recommendedWheels: [{tier: 'GOOD', wheelIds: ['wheel-9999']}],
              recommendedCovenantIds: ['covenant-0001'],
              recommendedPosseIds: ['posse-0001'],
            },
          ],
        },
      ],
    })
    const awakeners = parsePublicV2Envelope('awakeners', {
      schemaVersion: 1,
      scope: 'awakeners',
      recordCount: 1,
      records: [{id: 'awakener-0001'}],
    })
    const wheels = parsePublicV2Envelope('wheels', {
      schemaVersion: 1,
      scope: 'wheels',
      recordCount: 1,
      records: [{id: 'wheel-0001'}],
    })
    const covenants = parsePublicV2Envelope('covenants', {
      schemaVersion: 1,
      scope: 'covenants',
      recordCount: 1,
      records: [{id: 'covenant-0001'}],
    })
    const posses = parsePublicV2Envelope('posses', {
      schemaVersion: 1,
      scope: 'posses',
      recordCount: 1,
      records: [{id: 'posse-0001'}],
    })

    expect(() => {
      validatePublicV2Relationships([awakenerBuilds, awakeners, wheels, covenants, posses])
    }).toThrow(/wheel-9999/)
  })
})
