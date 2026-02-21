import { describe, expect, it } from 'vitest'
import { encodeMultiTeamCode, encodeSingleTeamCode, decodeImportCode } from './import-export'
import type { Team } from '../pages/builder/types'

function makeTeam(name: string): Team {
  return {
    id: `${name}-id`,
    name,
    posseId: 'taverns-opening',
    slots: [
      { slotId: 'slot-1', awakenerName: 'goliath', faction: 'AEQUOR', level: 60, wheels: ['SR19', 'C02'] },
      { slotId: 'slot-2', awakenerName: 'ramona', faction: 'CHAOS', level: 60, wheels: [null, null] },
      { slotId: 'slot-3', wheels: [null, null] },
      { slotId: 'slot-4', wheels: [null, null] },
    ],
  }
}

describe('import-export codec', () => {
  it('encodes single-team with t1 prefix and round-trips', () => {
    const team = makeTeam('Team 1')
    const code = encodeSingleTeamCode(team)
    expect(code.startsWith('t1.')).toBe(true)

    const parsed = decodeImportCode(code)
    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.name).toBe('Team 1')
    expect(parsed.team.posseId).toBe('taverns-opening')
    expect(parsed.team.slots[0].awakenerName).toBe('goliath')
    expect(parsed.team.slots[0].wheels).toEqual(['SR19', 'C02'])
  })

  it('encodes multi-team with mt1 prefix and round-trips', () => {
    const teams = [makeTeam('Team 1'), makeTeam('Team 2')]
    const code = encodeMultiTeamCode(teams, teams[1].id)
    expect(code.startsWith('mt1.')).toBe(true)

    const parsed = decodeImportCode(code)
    expect(parsed.kind).toBe('multi')
    if (parsed.kind !== 'multi') return
    expect(parsed.teams).toHaveLength(2)
    expect(parsed.activeTeamIndex).toBe(1)
    expect(parsed.teams[1].name).toBe('Team 2')
  })

  it('keeps export strings compact for single and 10-team payloads', () => {
    const singleCode = encodeSingleTeamCode(makeTeam('Team 9'))
    const tenTeams = Array.from({ length: 10 }, (_, index) => makeTeam(`Team ${index + 1}`))
    const multiCode = encodeMultiTeamCode(tenTeams, tenTeams[8].id)

    expect(singleCode.length).toBeLessThan(30)
    expect(multiCode.length).toBeLessThan(300)
  })

  it('strips wheel assignments from slots without awakeners during roundtrip', () => {
    const team = makeTeam('Team Dirty')
    team.slots[2] = { slotId: 'slot-3', wheels: ['SR19', 'C02'] }

    const code = encodeSingleTeamCode(team)
    const parsed = decodeImportCode(code)

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots[2].awakenerName).toBeUndefined()
    expect(parsed.team.slots[2].wheels).toEqual([null, null])
  })

  it('rejects unknown prefixes', () => {
    expect(() => decodeImportCode('x1.hello')).toThrow(/unsupported import code prefix/i)
  })

  it('rejects mt1 payloads with out-of-range active team index', () => {
    const source = encodeMultiTeamCode([makeTeam('Team 1')], 'Team 1-id')
    const payload = source.slice('mt1.'.length)
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    bytes[0] = 1
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index])
    }
    const mutated = `mt1.${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`

    expect(() => decodeImportCode(mutated)).toThrow(/invalid active team index/i)
  })
})
