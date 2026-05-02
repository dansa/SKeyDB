import {describe, expect, it} from 'vitest'

import type {Team} from '@/pages/builder/types'

import {decodeIngameTeamCode, encodeIngameTeamCode} from './ingame-codec'

function buildCodeWithCovenantTokens(slotTokens: string[], posseToken = 'd'): string {
  const filledTokens = [
    slotTokens[0] ?? 'a',
    slotTokens[1] ?? 'a',
    slotTokens[2] ?? 'a',
    slotTokens[3] ?? 'a',
  ]
  return `@@NDklaaaaaaaa${filledTokens.join('')}${posseToken}@@`
}

describe('decodeIngameTeamCode', () => {
  it('decodes in-game wrapper and consumes the 4 awakener prefix tokens in slot order', () => {
    const decoded = decodeIngameTeamCode(buildCodeWithCovenantTokens([], 'd'))

    expect(decoded.team.slots[0].awakenerName).toBeTruthy()
    expect(decoded.team.slots[1].awakenerName).toBeTruthy()
    expect(decoded.team.slots[2].awakenerName).toBeTruthy()
    expect(decoded.team.slots[3].awakenerName).toBeTruthy()
  })

  it('decodes wheel token order as wheel1 then wheel2 inside each slot', () => {
    const code = '@@NDklyT1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaad@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].wheels[0]).toBeTruthy()
    expect(decoded.team.slots[0].wheels[1]).toBeTruthy()
    expect(decoded.team.slots[1].wheels).toEqual([null, null])
    expect(decoded.team.slots[2].wheels).toEqual([null, null])
    expect(decoded.team.slots[3].wheels).toEqual([null, null])
  })

  it('decodes known covenant set tokens into canonical covenant ids', () => {
    const decoded = decodeIngameTeamCode(buildCodeWithCovenantTokens(['w', 'b', 'a', 'D']))

    expect(decoded.team.slots.map((slot) => slot.covenantId)).toEqual([
      'covenant-0020',
      'covenant-0014',
      undefined,
      'covenant-0006',
    ])
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(false)
  })

  it('matches observed in-game sample token order for laaI prefix', () => {
    const decoded = decodeIngameTeamCode('@@laaIaaaaaaaaaaaaX@@')

    expect(decoded.team.slots[0].awakenerName).toBe('doll')
    expect(decoded.team.slots[1].awakenerName).toBeUndefined()
    expect(decoded.team.slots[2].awakenerName).toBeUndefined()
    expect(decoded.team.slots[3].awakenerName).toBe('daffodil')
  })

  it('encodes in-game wrapper format with canonical slot ordering', () => {
    const team: Team = {
      id: 'team-1',
      name: 'Team 1',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'ramona',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0098', 'wheel-0014'],
          covenantId: 'covenant-0020',
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    const code = encodeIngameTeamCode(team)
    expect(code.startsWith('@@')).toBe(true)
    expect(code.endsWith('@@')).toBe(true)
    const decoded = decodeIngameTeamCode(code)
    expect(decoded.team.slots[0].awakenerName).toBe('ramona')
    expect(decoded.team.slots[0].wheels[0]).toBe('wheel-0098')
    expect(decoded.team.slots[0].wheels[1]).toBe('wheel-0014')
    expect(decoded.team.slots[0].covenantId).toBe('covenant-0020')
  })

  it('matches observed in-game export layout for no-covenant team with posse token', () => {
    const team: Team = {
      id: 'team-2',
      name: 'Team 2',
      posseId: 'posse-0047',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'doll: inferno',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0016', 'wheel-0077'],
        },
        {slotId: 'slot-2', awakenerName: 'doll', realm: 'CHAOS', level: 60, wheels: [null, null]},
        {
          slotId: 'slot-3',
          awakenerName: 'helot: catena',
          realm: 'CARO',
          level: 60,
          wheels: ['wheel-0006', 'wheel-0055'],
        },
        {
          slotId: 'slot-4',
          awakenerName: 'tawil',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0027', 'wheel-0078'],
        },
      ],
    }

    expect(encodeIngameTeamCode(team)).toBe('@@UliXxW5aaxY1xVxDaaaa2@@')
  })

  it('encodes covenant set tokens into the covenant payload zone', () => {
    const team: Team = {
      id: 'team-2b',
      name: 'Team 2b',
      posseId: 'posse-0047',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'doll: inferno',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0016', 'wheel-0077'],
          covenantId: 'covenant-0020',
        },
        {slotId: 'slot-2', awakenerName: 'doll', realm: 'CHAOS', level: 60, wheels: [null, null]},
        {
          slotId: 'slot-3',
          awakenerName: 'helot: catena',
          realm: 'CARO',
          level: 60,
          wheels: ['wheel-0006', 'wheel-0055'],
        },
        {
          slotId: 'slot-4',
          awakenerName: 'tawil',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0027', 'wheel-0078'],
        },
      ],
    }

    expect(encodeIngameTeamCode(team)).toBe('@@UliXxW5aaxY1xVxDwaaa2@@')
  })

  it('leaves covenant unset and warns when a covenant token is unknown', () => {
    const decoded = decodeIngameTeamCode(buildCodeWithCovenantTokens(['x']))

    expect(decoded.team.slots[0].covenantId).toBeUndefined()
    expect(
      decoded.warnings.some(
        (warning) =>
          warning.section === 'covenant' &&
          warning.slotIndex === 0 &&
          warning.reason === 'unknown_token',
      ),
    ).toBe(true)
  })

  it('decodes legacy long covenant tails without shifting wheel or posse parsing', () => {
    const code = '@@UliXxW5aaxY1xVxDaaaaaaaaax1aaaaaaaaaaaaaa2@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].awakenerName).toBe('doll: inferno')
    expect(decoded.team.slots[0].wheels).toEqual(['wheel-0016', 'wheel-0077'])
    expect(decoded.team.slots[1].awakenerName).toBe('doll')
    expect(decoded.team.slots[1].wheels).toEqual([null, null])
    expect(decoded.team.slots[2].awakenerName).toBe('helot: catena')
    expect(decoded.team.slots[2].wheels).toEqual(['wheel-0006', 'wheel-0055'])
    expect(decoded.team.slots[3].awakenerName).toBe('tawil')
    expect(decoded.team.slots[3].wheels).toEqual(['wheel-0027', 'wheel-0078'])
    expect(decoded.team.posseId).toBe('posse-0047')
    expect(
      decoded.warnings.some(
        (warning) => warning.section === 'covenant' && warning.reason === 'unknown_token',
      ),
    ).toBe(true)
  })

  it('fails closed instead of encoding selected values without in-game tokens as empty tokens', () => {
    const team: Team = {
      id: 'team-3',
      name: 'Team 3',
      posseId: 'posse-9999',
      slots: [
        {
          slotId: 'slot-1',
          awakenerName: 'ramona',
          realm: 'CHAOS',
          level: 60,
          wheels: ['wheel-0098', null],
        },
        {slotId: 'slot-2', wheels: [null, null]},
        {slotId: 'slot-3', wheels: [null, null]},
        {slotId: 'slot-4', wheels: [null, null]},
      ],
    }

    expect(() => encodeIngameTeamCode(team)).toThrow(/posse "posse-9999" is not representable/)
  })
})
