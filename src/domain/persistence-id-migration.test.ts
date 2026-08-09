import {describe, expect, it} from 'vitest'

import {getTestPublicCatalogRecords} from '@/data-access/public-data/testSupport/publicCatalogs'

import currentPersistenceContract from './persistence-contract.current.json'
import v1Contract from './persistence-contract.v1.json'
import {
  AWAKENER_ID_V1_TO_CURRENT,
  AWAKENER_NAME_V1_TO_CURRENT,
  COVENANT_ID_V1_TO_CURRENT,
  migrateAwakenerIdV1ToCurrent,
  migrateAwakenerNameV1ToCurrent,
  migrateCovenantIdV1ToCurrent,
  migratePosseIdV1ToCurrent,
  migrateWheelIdV1ToCurrent,
  POSSE_ID_V1_TO_CURRENT,
  WHEEL_ID_V1_TO_CURRENT,
} from './persistence-id-migration'

function publicIds(scope: Parameters<typeof getTestPublicCatalogRecords>[0]): Set<string> {
  return new Set(getTestPublicCatalogRecords(scope).map((record) => record.id))
}

function contractIds(records: {id: string}[]): Set<string> {
  return new Set(records.map((record) => record.id))
}

function expectNoValueCollisions(map: Readonly<Record<string, string>>): void {
  expect(new Set(Object.values(map)).size).toBe(Object.values(map).length)
}

describe('persistence V1 to current id migration', () => {
  it('maps plan examples to canonical public ids', () => {
    expect(migrateWheelIdV1ToCurrent('B01')).toBe('wheel-0001')
    expect(migrateWheelIdV1ToCurrent('D10')).toBe('wheel-0128')
    expect(migrateWheelIdV1ToCurrent('N02')).toBe('wheel-0049')
    expect(migrateWheelIdV1ToCurrent('O11')).toBe('wheel-0131')
    expect(migrateWheelIdV1ToCurrent('O112')).toBe('wheel-0060')
    expect(migrateWheelIdV1ToCurrent('P15')).toBe('wheel-0136')
    expect(migrateCovenantIdV1ToCurrent('001')).toBe('covenant-0001')
    expect(migrateCovenantIdV1ToCurrent('016')).toBe('covenant-0014')
    expect(migratePosseIdV1ToCurrent('24-all-of-her')).toBe('posse-0022')
    expect(migratePosseIdV1ToCurrent('orbis-fatum')).toBe('posse-0050')
  })

  it('uses explicit aliases and returns undefined for unknown values', () => {
    expect(migrateAwakenerIdV1ToCurrent(1)).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToCurrent('24')).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToCurrent('"24"')).toBe('awakener-0001')
    expect(migrateAwakenerNameV1ToCurrent('jenkins')).toBe('awakener-0025')
    expect(migrateAwakenerNameV1ToCurrent('Jenkin')).toBe('awakener-0025')

    expect(migrateAwakenerIdV1ToCurrent(999)).toBeUndefined()
    expect(migrateAwakenerNameV1ToCurrent('Jenkins ')).toBeUndefined()
    expect(migrateWheelIdV1ToCurrent('unknown')).toBeUndefined()
    expect(migrateCovenantIdV1ToCurrent('999')).toBeUndefined()
    expect(migratePosseIdV1ToCurrent('unknown')).toBeUndefined()
  })

  it('covers every frozen V1 persistence id', () => {
    const contract = v1Contract as {
      awakeners: {id: number; name: string}[]
      wheels: string[]
      covenants: string[]
      posses: {id: string}[]
    }

    expect(contract.awakeners.every((entry) => migrateAwakenerIdV1ToCurrent(entry.id))).toBe(true)
    expect(contract.awakeners.every((entry) => migrateAwakenerNameV1ToCurrent(entry.name))).toBe(
      true,
    )
    expect(contract.wheels.every((id) => migrateWheelIdV1ToCurrent(id))).toBe(true)
    expect(contract.covenants.every((id) => migrateCovenantIdV1ToCurrent(id))).toBe(true)
    expect(contract.posses.every((entry) => migratePosseIdV1ToCurrent(entry.id))).toBe(true)
  })

  it('points every generated map value at an existing current contract and public record', () => {
    const current = currentPersistenceContract as {
      awakeners: {id: string}[]
      wheels: {id: string}[]
      covenants: {id: string}[]
      posses: {id: string}[]
    }
    const contractAwakenerIds = contractIds(current.awakeners)
    const contractWheelIds = contractIds(current.wheels)
    const contractCovenantIds = contractIds(current.covenants)
    const contractPosseIds = contractIds(current.posses)
    const awakenerIds = publicIds('awakeners')
    const wheelIds = publicIds('wheels')
    const covenantIds = publicIds('covenants')
    const posseIds = publicIds('posses')

    expect(
      Object.values(AWAKENER_ID_V1_TO_CURRENT).every((id) => contractAwakenerIds.has(id)),
    ).toBe(true)
    expect(
      Object.values(AWAKENER_NAME_V1_TO_CURRENT).every((id) => contractAwakenerIds.has(id)),
    ).toBe(true)
    expect(Object.values(WHEEL_ID_V1_TO_CURRENT).every((id) => contractWheelIds.has(id))).toBe(true)
    expect(
      Object.values(COVENANT_ID_V1_TO_CURRENT).every((id) => contractCovenantIds.has(id)),
    ).toBe(true)
    expect(Object.values(POSSE_ID_V1_TO_CURRENT).every((id) => contractPosseIds.has(id))).toBe(true)
    expect(Object.values(AWAKENER_ID_V1_TO_CURRENT).every((id) => awakenerIds.has(id))).toBe(true)
    expect(Object.values(AWAKENER_NAME_V1_TO_CURRENT).every((id) => awakenerIds.has(id))).toBe(true)
    expect(Object.values(WHEEL_ID_V1_TO_CURRENT).every((id) => wheelIds.has(id))).toBe(true)
    expect(Object.values(COVENANT_ID_V1_TO_CURRENT).every((id) => covenantIds.has(id))).toBe(true)
    expect(Object.values(POSSE_ID_V1_TO_CURRENT).every((id) => posseIds.has(id))).toBe(true)
  })

  it('does not collapse distinct V1 ids within a migration scope', () => {
    expectNoValueCollisions(AWAKENER_ID_V1_TO_CURRENT)
    expectNoValueCollisions(WHEEL_ID_V1_TO_CURRENT)
    expectNoValueCollisions(COVENANT_ID_V1_TO_CURRENT)
    expectNoValueCollisions(POSSE_ID_V1_TO_CURRENT)
  })
})
