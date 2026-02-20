import { describe, expect, it } from 'vitest'
import { searchPosses } from './posses-search'
import { getPosses } from './posses'

describe('searchPosses', () => {
  const posses = getPosses()

  it('matches by faded legacy realm label', () => {
    const names = searchPosses(posses, 'faded legacy').map((posse) => posse.name.toLowerCase())
    expect(names).toContain('voices in your head')
    expect(names).toContain('tiny wish')
  })

  it('matches by linked awakener alias', () => {
    const results = searchPosses(posses, 'ghelot')
    expect(results.some((posse) => posse.awakenerName === 'helot: catena')).toBe(true)
  })

  it('matches by posse name fuzzy typo', () => {
    const names = searchPosses(posses, 'obsesion eternal').map((posse) => posse.name.toLowerCase())
    expect(names).toContain('obsession eternal')
  })
})
