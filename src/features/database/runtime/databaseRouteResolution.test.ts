import {describe, expect, it} from 'vitest'

import {parseDatabaseRoutePath} from './databaseRouteResolution'

describe('parseDatabaseRoutePath', () => {
  it.each([
    ['/database', {entity: 'awakeners', kind: 'browse'}],
    ['/database/wheels', {entity: 'wheels', kind: 'browse'}],
    ['/database/posses', {entity: 'posses', kind: 'browse'}],
    ['/database/covenants', {entity: 'covenants', kind: 'browse'}],
    ['/database/relics', {entity: 'relics', kind: 'browse'}],
  ] as const)('parses the browse route %s', (pathname, expected) => {
    expect(parseDatabaseRoutePath(pathname)).toEqual(expected)
  })

  it.each([
    [
      '/database/awakeners/24/skills',
      {entity: 'awakeners', kind: 'detail', slug: '24', suffixSegments: ['skills']},
    ],
    [
      '/database/wheels/merciful-nurturing',
      {entity: 'wheels', kind: 'detail', slug: 'merciful-nurturing', suffixSegments: []},
    ],
    [
      '/database/relics/dimensional-image-24',
      {entity: 'relics', kind: 'detail', slug: 'dimensional-image-24', suffixSegments: []},
    ],
  ] as const)('parses the detail route %s', (pathname, expected) => {
    expect(parseDatabaseRoutePath(pathname)).toEqual(expected)
  })

  it.each([
    '/database/unknown',
    '/database/awakeners',
    '/database/wheels/item/extra',
    '/database/awakeners/item/tab/extra',
    '/database/%E0%A4%A',
  ])('rejects the invalid database route %s', (pathname) => {
    expect(parseDatabaseRoutePath(pathname).kind).toBe('invalid')
  })
})
