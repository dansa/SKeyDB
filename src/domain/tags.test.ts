import {describe, expect, it} from 'vitest'

import {getTags, resolveTag} from './tags'

function expectResolvedTag(token: string) {
  const tag = resolveTag(token)
  expect(tag).not.toBeNull()
  if (!tag) {
    throw new Error(`Expected tag for ${token}`)
  }
  return tag
}

describe('tags', () => {
  it('loads all tags from data file', () => {
    const tags = getTags()
    expect(tags.length).toBeGreaterThan(100)
    expect(tags.every((t) => t.key && t.label)).toBe(true)
    expect(new Set(tags.map((t) => t.key)).size).toBe(tags.length)
  })

  it('resolves tag by exact label', () => {
    const tag = expectResolvedTag('Stun')
    expect(tag.key).toBe('STUN')
    expect(tag.description).toBeTruthy()
  })

  it('resolves tag by alias (Fainted -> Stun)', () => {
    const tag = expectResolvedTag('Fainted')
    expect(tag.key).toBe('STUN')
    expect(tag.description).toContain('Stunned')
  })

  it('resolves tag by alias (Petrify -> Stun)', () => {
    const tag = expectResolvedTag('Petrify')
    expect(tag.key).toBe('STUN')
  })

  it('returns null for unknown token', () => {
    expect(resolveTag('TotallyMadeUp')).toBeNull()
  })

  it('prefers label match over alias match', () => {
    const tag = expectResolvedTag('Vulnerability')
    expect(tag.label).toBe('Vulnerability')
  })

  it('resolves tag by alias (Vulnerable -> Vulnerability)', () => {
    const tag = expectResolvedTag('Vulnerable')
    expect(tag.label).toBe('Vulnerability')
  })

  it('resolves temporary mechanic aliases to their base tag', () => {
    expect(resolveTag('Temporary Counter')?.label).toBe('Counter')
    expect(resolveTag('Temporary Barrier')?.label).toBe('Barrier')
    expect(resolveTag('Temporary Hand Limit')?.label).toBe('Hand Limit')
    expect(resolveTag('Temporary Tentacle DMG')?.label).toBe('Tentacle DMG')
    expect(resolveTag('Temporary STR')?.label).toBe('STR')
  })
})
