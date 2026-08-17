import {describe, expect, it} from 'vitest'

import {createPublicSearchDocumentRepository} from './publicSearchDocumentRepository'
import type {SearchablePublicDataScope} from './scopeRegistry'

function createIndex(records: unknown[]) {
  return {schemaVersion: 3, scope: 'awakeners', records}
}

function createDocument(id: string) {
  return {
    kind: 'awakener',
    id,
    name: `Fixture ${id}`,
    aliases: [],
    tokens: [],
    fields: {name: [`Fixture ${id}`]},
  }
}

describe('public search document repository', () => {
  it('validates lazily and reuses document identity across reads', () => {
    const repository = createPublicSearchDocumentRepository(
      'awakeners',
      createIndex([createDocument('awakener-0001')]),
    )

    const first = repository.getDocument('awakener-0001')
    expect(first?.id).toBe('awakener-0001')
    expect(repository.getDocument('awakener-0001')).toBe(first)
    expect(repository.getDocuments().map((document) => document.id)).toEqual(['awakener-0001'])
  })

  it('rejects a source whose declared scope does not match its adapter', () => {
    const repository = createPublicSearchDocumentRepository('wheels', createIndex([]))

    expect(() => repository.getDocuments()).toThrow(
      'Public V3 search index scope "awakeners" does not match requested scope "wheels".',
    )
  })

  it('rejects a public scope without generated search capability', () => {
    const unsupportedScope = 'skills' as SearchablePublicDataScope
    const repository = createPublicSearchDocumentRepository(unsupportedScope, {
      schemaVersion: 3,
      scope: 'skills',
      records: [],
    })

    expect(() => repository.getDocuments()).toThrow(
      'Public V3 scope "skills" does not support search indexes.',
    )
  })

  it('rejects duplicate document ids before exposing the source', () => {
    const document = createDocument('awakener-0001')
    const repository = createPublicSearchDocumentRepository(
      'awakeners',
      createIndex([document, document]),
    )

    expect(() => repository.getDocuments()).toThrow(
      'Public V3 search index "awakeners" contains duplicate id "awakener-0001".',
    )
  })
})
