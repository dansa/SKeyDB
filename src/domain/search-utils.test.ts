import {describe, expect, it} from 'vitest'

import {normalizeForSearch} from './search-utils'

describe('normalizeForSearch', () => {
  it('lowercases and strips non-alphanumeric characters', () => {
    expect(normalizeForSearch('Hello World!')).toBe('helloworld')
  })

  it('preserves digits', () => {
    expect(normalizeForSearch('Unit-42')).toBe('unit42')
  })

  it('returns empty string for non-alphanumeric input', () => {
    expect(normalizeForSearch('---')).toBe('')
  })

  it('handles empty string', () => {
    expect(normalizeForSearch('')).toBe('')
  })

  it('strips unicode and special characters', () => {
    expect(normalizeForSearch('café résumé')).toBe('cafrsum')
  })
})
