import { describe, expect, it } from 'vitest'
import { decodeIngameTeamCode, encodeIngameTeamCode } from './ingame-codec'
import type { Team } from '../pages/builder/types'

describe('decodeIngameTeamCode', () => {
  it('decodes in-game wrapper and consumes the 4 awakener prefix tokens in slot order', () => {
    const code = '@@NDklaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad@@'
    const decoded = decodeIngameTeamCode(code)

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

  it('keeps import recoverable and reports warnings for unsupported covenant/posse blocks', () => {
    const code = '@@NDklZ1OxFcxEB5ytkysyDHxmxAxXIWxwxbxlSx5xZxT7xlSx5xZxT7d@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots.every((slot) => Boolean(slot.awakenerName))).toBe(true)
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(true)
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(true)
  })

  it('matches observed in-game sample token order for laaI prefix', () => {
    const code = '@@laaIaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX@@'
    const decoded = decodeIngameTeamCode(code)

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
        { slotId: 'slot-1', awakenerName: 'ramona', faction: 'CHAOS', level: 60, wheels: ['SR22', 'C01'] },
        { slotId: 'slot-2', wheels: [null, null] },
        { slotId: 'slot-3', wheels: [null, null] },
        { slotId: 'slot-4', wheels: [null, null] },
      ],
    }

    const code = encodeIngameTeamCode(team)
    expect(code.startsWith('@@')).toBe(true)
    expect(code.endsWith('@@')).toBe(true)
    const decoded = decodeIngameTeamCode(code)
    expect(decoded.team.slots[0].awakenerName).toBe('ramona')
    expect(decoded.team.slots[0].wheels[0]).toBe('SR22')
    expect(decoded.team.slots[0].wheels[1]).toBe('C01')
  })

  it('normalizes unsupported covenant slices to empty placeholders when re-encoding', () => {
    const source = '@@Sir7Z5aaaaJxnaxm1aaaaaaaaaxaaaaaaaaaaaaaa@@'
    const decoded = decodeIngameTeamCode(source)
    const reEncoded = encodeIngameTeamCode(decoded.team)
    expect(reEncoded).toBe('@@Sir7Z5aaaaJxnaaaaaaaaaaaaaaaaaaaaaaaaa@@')
  })

  it('matches observed in-game export layout for no-covenant team with posse token', () => {
    const team: Team = {
      id: 'team-2',
      name: 'Team 2',
      posseId: 'manor-echoes',
      slots: [
        { slotId: 'slot-1', awakenerName: 'doll: inferno', faction: 'CHAOS', level: 60, wheels: ['C02EX', 'SR01'] },
        { slotId: 'slot-2', awakenerName: 'doll', faction: 'CHAOS', level: 60, wheels: [null, null] },
        { slotId: 'slot-3', awakenerName: 'helot: catena', faction: 'CARO', level: 60, wheels: ['B05EX', 'O06'] },
        { slotId: 'slot-4', awakenerName: 'tawil', faction: 'CHAOS', level: 60, wheels: ['C15', 'SR02'] },
      ],
    }

    expect(encodeIngameTeamCode(team)).toBe('@@UliXxW5aaxY1xVxDaaaaaaaaaaaaaaaaaaaaaaaa3@@')
  })

  it('decodes covenant slice noise without shifting wheel or posse parsing', () => {
    const code = '@@UliXxW5aaxY1xVxDaaaaaaaaaxKaaaaaaaaaaaaaa3@@'
    const decoded = decodeIngameTeamCode(code)

    expect(decoded.team.slots[0].awakenerName).toBe('doll: inferno')
    expect(decoded.team.slots[0].wheels).toEqual(['C02EX', 'SR01'])
    expect(decoded.team.slots[1].awakenerName).toBe('doll')
    expect(decoded.team.slots[1].wheels).toEqual([null, null])
    expect(decoded.team.slots[2].awakenerName).toBe('helot: catena')
    expect(decoded.team.slots[2].wheels).toEqual(['B05EX', 'O06'])
    expect(decoded.team.slots[3].awakenerName).toBe('tawil')
    expect(decoded.team.slots[3].wheels).toEqual(['C15', 'SR02'])
    expect(decoded.team.posseId).toBe('manor-echoes')
    expect(decoded.warnings.some((warning) => warning.section === 'covenant')).toBe(true)
  })
})
