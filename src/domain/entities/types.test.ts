import {describe, expect, it} from 'vitest'

import {
  asPublicEntityId,
  getEntityKindForPublicDataScope,
  getPublicDataScopeForEntityKind,
  isPublicEntityId,
} from './types'

describe('entity type facade', () => {
  it('maps public entity kinds and data scopes through the current contract', () => {
    expect(getPublicDataScopeForEntityKind('awakener')).toBe('awakeners')
    expect(getPublicDataScopeForEntityKind('awakenerBuild')).toBe('awakener-builds')
    expect(getPublicDataScopeForEntityKind('wheel')).toBe('wheels')

    expect(getEntityKindForPublicDataScope('covenants')).toBe('covenant')
    expect(getEntityKindForPublicDataScope('derived-skills')).toBe('derivedSkill')
  })

  it('guards runtime identity as public ids, not names or legacy ids', () => {
    expect(isPublicEntityId('awakener', 'awakener-0024')).toBe(true)
    expect(isPublicEntityId('wheel', 'wheel-0001')).toBe(true)
    expect(isPublicEntityId('wheel', 'B01')).toBe(false)
    expect(isPublicEntityId('awakener', 'goliath')).toBe(false)

    expect(asPublicEntityId('covenant', 'covenant-0020')).toBe('covenant-0020')
    expect(asPublicEntityId('covenant', '022')).toBeNull()
  })
})
