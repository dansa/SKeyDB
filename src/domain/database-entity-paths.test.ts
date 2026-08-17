import {describe, expect, it} from 'vitest'

import {getDatabaseBrowsePathForLocation} from './database-entity-paths'

describe('getDatabaseBrowsePathForLocation', () => {
  it.each([
    ['/database', '/database'],
    ['/database/awakeners/example/skills', '/database'],
    ['/database/wheels/example', '/database/wheels'],
    ['/database/posses/example', '/database/posses'],
    ['/database/covenants/example', '/database/covenants'],
    ['/database/relics/example', '/database/relics'],
  ])('keeps %s in the %s browse-page boundary', (pathname, browsePath) => {
    expect(getDatabaseBrowsePathForLocation(pathname)).toBe(browsePath)
  })

  it('leaves unrelated routes outside the database boundary', () => {
    expect(getDatabaseBrowsePathForLocation('/timeline')).toBeNull()
  })
})
