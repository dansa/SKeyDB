import { describe, expect, it } from 'vitest'
import { getTags, resolveTag } from './tags'

describe('tags', () => {
  it('loads all tags from data file', () => {
    const tags = getTags()
    expect(tags.length).toBeGreaterThan(100)
    expect(tags.every((t) => t.key && t.label)).toBe(true)
    expect(new Set(tags.map((t) => t.key)).size).toBe(tags.length)
  })

  it('resolves tag by exact label', () => {
    const tag = resolveTag('Stun')
    expect(tag).not.toBeNull()
    expect(tag!.key).toBe('STUN')
    expect(tag!.description).toBeTruthy()
  })

  it('resolves tag by alias (Fainted -> Stun)', () => {
    const tag = resolveTag('Fainted')
    expect(tag).not.toBeNull()
    expect(tag!.key).toBe('STUN')
    expect(tag!.description).toContain('Stunned')
  })

  it('resolves tag by alias (Petrify -> Stun)', () => {
    const tag = resolveTag('Petrify')
    expect(tag).not.toBeNull()
    expect(tag!.key).toBe('STUN')
  })

  it('returns null for unknown token', () => {
    expect(resolveTag('TotallyMadeUp')).toBeNull()
  })

  it('prefers label match over alias match', () => {
    const tag = resolveTag('Vulnerability')
    expect(tag).not.toBeNull()
    expect(tag!.label).toBe('Vulnerability')
  })

  it('resolves tag by alias (Vulnerable -> Vulnerability)', () => {
    const tag = resolveTag('Vulnerable')
    expect(tag).not.toBeNull()
    expect(tag!.label).toBe('Vulnerability')
  })
})
