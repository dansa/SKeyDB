import {describe, expect, it, vi} from 'vitest'

import type {Team} from '@/features/builder/types'

import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import {decodeImportCode, encodeMultiTeamCode, encodeSingleTeamCode} from './import-export'
import {getPosses} from './posses'
import standardCodeContract from './standard-code-contract.v1.json'
import {getWheels} from './wheels'

function makeTeam(name: string): Team {
  return {
    id: `${name}-id`,
    name,
    posseId: 'posse-0033',
    slots: [
      {
        slotId: 'slot-1',
        awakenerId: 'awakener-0021',
        realm: 'AEQUOR',
        level: 60,
        wheels: ['wheel-0095', 'wheel-0096'],
        covenantId: 'covenant-0001',
      },
      {
        slotId: 'slot-2',
        awakenerId: 'awakener-0042',
        realm: 'CHAOS',
        level: 60,
        wheels: [null, null],
      },
      {slotId: 'slot-3', wheels: [null, null]},
      {slotId: 'slot-4', wheels: [null, null]},
    ],
  }
}

function trimTrailingPadding(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === '=') {
    end -= 1
  }
  return value.slice(0, end)
}

describe('import-export codec', () => {
  it('keeps every current builder catalog id representable in the standard byte contract', () => {
    const contractScopes = [
      {
        name: 'awakeners',
        currentIds: getAwakeners().map((awakener) => awakener.id),
        contractIds: standardCodeContract.awakeners.map((entry) => entry.id),
      },
      {
        name: 'wheels',
        currentIds: getWheels().map((wheel) => wheel.id),
        contractIds: standardCodeContract.wheels.map((entry) => entry.id),
      },
      {
        name: 'covenants',
        currentIds: getCovenants().map((covenant) => covenant.id),
        contractIds: standardCodeContract.covenants.map((entry) => entry.id),
      },
      {
        name: 'posses',
        currentIds: getPosses().map((posse) => posse.id),
        contractIds: standardCodeContract.posses.map((entry) => entry.id),
      },
    ]

    const missingByScope = Object.fromEntries(
      contractScopes.map(({name, currentIds, contractIds}) => {
        const contractIdSet = new Set(contractIds)
        return [name, currentIds.filter((id) => !contractIdSet.has(id))]
      }),
    )

    expect(missingByScope).toEqual({
      awakeners: [],
      wheels: [],
      covenants: [],
      posses: [],
    })
  })

  it('encodes single-team with t1 prefix and round-trips', () => {
    const team = makeTeam('Team 1')
    const code = encodeSingleTeamCode(team)
    expect(code.startsWith('t1.')).toBe(true)
    expect(code).toBe('t1.IRU8YmMBKjwAAAAAAAAAAAAAAAAA')

    const parsed = decodeImportCode(code)
    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.name).toBe('Team 1')
    expect(parsed.team.posseId).toBe('posse-0033')
    expect(parsed.team.slots[0].awakenerId).toBe('awakener-0021')
    expect('awakenerName' in parsed.team.slots[0]).toBe(false)
    expect(parsed.team.slots[0].wheels).toEqual(['wheel-0095', 'wheel-0096'])
    expect(parsed.team.slots[0].covenantId).toBe('covenant-0001')
  })

  it('encodes current canonical ids through the frozen standard-code byte contract', () => {
    const team = makeTeam('Canonical Team')
    team.posseId = 'posse-0033'
    team.slots[0].wheels = ['wheel-0095', 'wheel-0096']
    team.slots[0].covenantId = 'covenant-0001'

    const code = encodeSingleTeamCode(team)
    expect(code).toBe('t1.IRU8YmMBKjwAAAAAAAAAAAAAAAAA')

    const parsed = decodeImportCode(code)
    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.posseId).toBe('posse-0033')
    expect(parsed.team.slots[0].wheels).toEqual(['wheel-0095', 'wheel-0096'])
    expect(parsed.team.slots[0].covenantId).toBe('covenant-0001')
    expect(parsed.team.slots[0].awakenerId).toBe('awakener-0021')
    expect('awakenerName' in parsed.team.slots[0]).toBe(false)
  })

  it('throws when a selected unknown posse is not representable in the standard-code byte contract', () => {
    const team = makeTeam('Orbis Fatum Team')
    team.posseId = 'posse-9999'

    expect(() => encodeSingleTeamCode(team)).toThrow(
      /posse "posse-9999" is not representable in the frozen standard export format/i,
    )
  })

  it('decodes frozen t1 byte meanings through current runtime ids', () => {
    const parsed = decodeImportCode('t1.IRU8YmMBKjwAAAAAAAAAAAAAAAAA')

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.posseId).toBe('posse-0033')
    expect(parsed.team.slots[0].awakenerId).toBe('awakener-0021')
    expect('awakenerName' in parsed.team.slots[0]).toBe(false)
    expect(parsed.team.slots[0].wheels).toEqual(['wheel-0095', 'wheel-0096'])
    expect(parsed.team.slots[0].covenantId).toBe('covenant-0001')
    expect(parsed.team.slots[1].awakenerId).toBe('awakener-0042')
    expect('awakenerName' in parsed.team.slots[1]).toBe(false)
  })

  it('decodes standard awakeners by public id before the transitional legacy name', async () => {
    vi.resetModules()
    const mutatedContract = structuredClone(standardCodeContract)
    const targetEntry = mutatedContract.awakeners.find((entry) => entry.id === 'awakener-0021')
    if (!targetEntry) {
      throw new Error('Expected standard code contract to include awakener-0021')
    }
    targetEntry.legacyName = 'renamed legacy value'
    vi.doMock('./standard-code-contract.v1.json', () => ({default: mutatedContract}))

    const {decodeImportCode: decodeWithMutatedContract} = await import('./import-export')
    const parsed = decodeWithMutatedContract('t1.IRU8YmMBKjwAAAAAAAAAAAAAAAAA')

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots[0].awakenerId).toBe('awakener-0021')

    vi.doUnmock('./standard-code-contract.v1.json')
  })

  it('round-trips Vortice in standard t1 export codes even without in-game @@ token support', () => {
    const team = makeTeam('Vortice Team')
    team.slots[0] = {
      slotId: 'slot-1',
      awakenerId: 'awakener-0055',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null],
    }

    const code = encodeSingleTeamCode(team)
    const parsed = decodeImportCode(code)

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots[0].awakenerId).toBe('awakener-0055')
    expect('awakenerName' in parsed.team.slots[0]).toBe(false)
    expect(parsed.team.slots[0].realm).toBe('AEQUOR')
    expect(parsed.team.slots[0].wheels).toEqual([null, null])
  })

  it('round-trips Saya and her current collab equipment in standard mt1 export codes', () => {
    const team = makeTeam('Saya Team')
    team.posseId = 'posse-0051'
    team.slots[0] = {
      slotId: 'slot-1',
      awakenerId: 'awakener-0057',
      realm: 'CARO',
      level: 60,
      wheels: ['wheel-0167', 'wheel-0168'],
    }

    const code = encodeMultiTeamCode([team], team.id)
    const parsed = decodeImportCode(code)

    expect(parsed.kind).toBe('multi')
    if (parsed.kind !== 'multi') return
    expect(parsed.teams[0].posseId).toBe('posse-0051')
    expect(parsed.teams[0].slots[0].awakenerId).toBe('awakener-0057')
    expect(parsed.teams[0].slots[0].wheels).toEqual(['wheel-0167', 'wheel-0168'])
    expect(parsed.teams[0].slots[0].realm).toBe('CARO')
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

  it('preserves support slot state in mt1 multi-team exports without changing non-support levels', () => {
    const teams = [makeTeam('Team 1'), makeTeam('Team 2')]
    teams[1].slots[0] = {
      slotId: 'slot-1',
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      level: 90,
      isSupport: true,
      wheels: ['wheel-0095', null],
    }
    teams[1].slots[1] = {
      slotId: 'slot-2',
      awakenerId: 'awakener-0042',
      realm: 'CHAOS',
      level: 88,
      wheels: [null, null],
    }

    const code = encodeMultiTeamCode(teams, teams[1].id)
    const parsed = decodeImportCode(code)

    expect(parsed.kind).toBe('multi')
    if (parsed.kind !== 'multi') return
    expect(parsed.teams[1].slots[0].isSupport).toBe(true)
    expect(parsed.teams[1].slots[0].level).toBe(90)
    expect(parsed.teams[1].slots[1].isSupport).toBeUndefined()
    expect(parsed.teams[1].slots[1].level).toBe(88)
  })

  it('keeps export strings compact for single and 10-team payloads', () => {
    const singleCode = encodeSingleTeamCode(makeTeam('Team 9'))
    const tenTeams = Array.from({length: 10}, (_, index) => makeTeam(`Team ${String(index + 1)}`))
    const multiCode = encodeMultiTeamCode(tenTeams, tenTeams[8].id)

    expect(singleCode.length).toBeLessThan(35)
    expect(multiCode.length).toBeLessThan(380)
  })

  it('strips wheel assignments from slots without awakeners during roundtrip', () => {
    const team = makeTeam('Team Dirty')
    team.slots[2] = {
      slotId: 'slot-3',
      wheels: ['wheel-0095', 'wheel-0096'],
      covenantId: 'covenant-0001',
    }

    const code = encodeSingleTeamCode(team)
    const parsed = decodeImportCode(code)

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots[2].awakenerId).toBeUndefined()
    expect('awakenerName' in parsed.team.slots[2]).toBe(false)
    expect(parsed.team.slots[2].wheels).toEqual([null, null])
    expect(parsed.team.slots[2].covenantId).toBeUndefined()
  })

  it('rejects unknown prefixes', () => {
    expect(() => decodeImportCode('x1.hello')).toThrow(/unsupported import code prefix/i)
  })

  it('rejects oversized t1 input before base64 decode', () => {
    const atobSpy = vi.spyOn(globalThis, 'atob').mockImplementation(() => {
      throw new Error('atob should not be called')
    })

    expect(() => decodeImportCode(`t1.${'A'.repeat(1024)}`)).toThrow(/import code is too long/i)
    expect(atobSpy).not.toHaveBeenCalled()

    atobSpy.mockRestore()
  })

  it('rejects oversized mt1 input before base64 decode', () => {
    const atobSpy = vi.spyOn(globalThis, 'atob').mockImplementation(() => {
      throw new Error('atob should not be called')
    })

    expect(() => decodeImportCode(`mt1.${'A'.repeat(8000)}`)).toThrow(/import code is too long/i)
    expect(atobSpy).not.toHaveBeenCalled()

    atobSpy.mockRestore()
  })

  it('rejects oversized wrapped in-game input', () => {
    expect(() => decodeImportCode(`@@${'A'.repeat(600)}@@`)).toThrow(/import code is too long/i)
  })

  it('auto-detects and imports in-game @@ wrapper codes', () => {
    const parsed = decodeImportCode('@@NDklaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad@@')
    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots.every((slot) => Boolean(slot.awakenerId))).toBe(true)
    expect(parsed.team.slots.every((slot) => !('awakenerName' in slot))).toBe(true)
  })

  it('bounds retained in-game warning token previews', () => {
    const payload = 'NDklaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad'
    const codeWithTrailingCovenantContent = `@@${payload.slice(0, -1)}${'Z'.repeat(80)}${payload.slice(-1)}@@`

    const parsed = decodeImportCode(codeWithTrailingCovenantContent)

    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    const covenantWarning = parsed.warnings?.find(
      (warning) => warning.section === 'covenant' && warning.reason === 'unknown_token',
    )
    expect(covenantWarning?.token.length).toBeLessThanOrEqual(32)
  })

  it('extracts and imports @@ code from full copied in-game block text', () => {
    const pasted = `Investigation Lineup
Keeper: FjanT（101330134） Team: Team2

Thais, Merciful Nurturing, Kiss of Farewell, Steppenwolf
Helot: Catena, Drowning in Crimson, To My Dearest Friend, April Tribute
Murphy, Shrouded Birth, Mind Barrier, Steppenwolf
Corposant, Dear Papa Noel, We Will Meet Again, Steppenwolf
The Lone Seed

@@Oir7xbxSxYxHmJyUyTxfhQuExRxp6gNKxCxfhQuExRxfhQuEyAG@@`

    const parsed = decodeImportCode(pasted)
    expect(parsed.kind).toBe('single')
    if (parsed.kind !== 'single') return
    expect(parsed.team.slots.every((slot) => Boolean(slot.awakenerId))).toBe(true)
    expect(parsed.team.slots.every((slot) => !('awakenerName' in slot))).toBe(true)
  })

  it('extracts t1 code from surrounding text', () => {
    const code = encodeSingleTeamCode(makeTeam('Team wrapped'))
    const parsed = decodeImportCode(`Here is my export:\n${code}\nThanks!`)
    expect(parsed.kind).toBe('single')
  })

  it('rejects mt1 payloads with out-of-range active team index', () => {
    const source = encodeMultiTeamCode([makeTeam('Team 1')], 'Team 1-id')
    const payload = source.slice('mt1.'.length)
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0))
    bytes[0] = 1
    let binary = ''
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    const mutated = `mt1.${trimTrailingPadding(btoa(binary).replace(/\+/g, '-').replace(/\//g, '_'))}`

    expect(() => decodeImportCode(mutated)).toThrow(/invalid active team index/i)
  })
})
