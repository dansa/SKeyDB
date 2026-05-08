import {describe, expect, it} from 'vitest'

import {getPublicCatalogRecords} from '@/data-access/public-data/repository'

import {getAwakeners} from './awakeners'
import {getCovenants} from './covenants'
import currentPersistenceContract from './persistence-contract.current.json'
import frozenContract from './persistence-contract.v1.json'
import {
  migrateAwakenerIdV1ToCurrent,
  migrateCovenantIdV1ToCurrent,
  migratePosseIdV1ToCurrent,
  migrateWheelIdV1ToCurrent,
} from './persistence-id-migration'
import {getPosses} from './posses'
import standardCodeContract from './standard-code-contract.v1.json'
import {getWheels} from './wheels'

interface PersistenceContractAwakenerEntry {
  name: string
  id: string | number
}

interface PersistenceContractPosseEntry {
  id: string
  index: number
}

interface PersistenceContract {
  version: number
  awakeners: PersistenceContractAwakenerEntry[]
  wheels: string[]
  posses: PersistenceContractPosseEntry[]
  covenants: string[]
}

interface CurrentContractEntry {
  id: string
}

interface StandardCodeEntry {
  codecIndex: number
  legacyId: number | string
  id: string
}

interface StandardCodeContract {
  version: number
  layout: string
  awakeners: StandardCodeEntry[]
  wheels: StandardCodeEntry[]
  posses: StandardCodeEntry[]
  covenants: StandardCodeEntry[]
}

function buildCurrentContract(): PersistenceContract {
  return {
    version: 1,
    awakeners: getAwakeners()
      .map((awakener) => ({name: awakener.name, id: awakener.id}))
      .sort((left, right) => left.name.localeCompare(right.name)),
    wheels: getWheels().map((wheel) => wheel.id),
    posses: getPosses()
      .map((posse) => ({id: posse.id, index: posse.index}))
      .sort((left, right) => left.id.localeCompare(right.id)),
    covenants: getCovenants().map((covenant) => covenant.id),
  }
}

function publicCatalogIds(scope: Parameters<typeof getPublicCatalogRecords>[0]): string[] {
  return getPublicCatalogRecords(scope).map((record) => record.id)
}

function contractIds(records: CurrentContractEntry[]): string[] {
  return records.map((record) => record.id)
}

function expectUniqueCodecIndices(records: StandardCodeEntry[]): void {
  expect(new Set(records.map((entry) => entry.codecIndex)).size).toBe(records.length)
}

describe('persistence contract', () => {
  it('keeps current runtime identifiers aligned with the current persistence contract', () => {
    const current = buildCurrentContract()
    const expected = currentPersistenceContract as {
      awakeners: CurrentContractEntry[]
      wheels: CurrentContractEntry[]
      covenants: CurrentContractEntry[]
      posses: CurrentContractEntry[]
    }

    expect([...current.awakeners.map((entry) => entry.id)].sort()).toEqual(
      [...contractIds(expected.awakeners)].sort(),
    )
    expect(current.wheels).toEqual(contractIds(expected.wheels))
    expect(current.covenants).toEqual(contractIds(expected.covenants))
    expect(current.posses.map((entry) => entry.id)).toEqual(contractIds(expected.posses))
  })

  it('keeps current persistence contract ids canonical against public V3 catalogs', () => {
    const contract = currentPersistenceContract

    expect(contract.version).toBe(2)
    expect(contract.awakeners).toEqual(contract.awakeners.map((entry) => ({id: entry.id})))
    expect(contract.wheels).toEqual(contract.wheels.map((entry) => ({id: entry.id})))
    expect(contract.covenants).toEqual(contract.covenants.map((entry) => ({id: entry.id})))
    expect(contract.posses).toEqual(contract.posses.map((entry) => ({id: entry.id})))
    expect(contract.awakeners.every((entry) => /^awakener-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.wheels.every((entry) => /^wheel-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.covenants.every((entry) => /^covenant-\d{4}$/.test(entry.id))).toBe(true)
    expect(contract.posses.every((entry) => /^posse-\d{4}$/.test(entry.id))).toBe(true)
    expect(contractIds(contract.awakeners)).toEqual(publicCatalogIds('awakeners'))
    expect(contractIds(contract.wheels)).toEqual(publicCatalogIds('wheels'))
    expect(contractIds(contract.covenants)).toEqual(publicCatalogIds('covenants'))
    expect(contractIds(contract.posses)).toEqual(publicCatalogIds('posses'))
  })

  it('preserves V1 standard-code codec indices as unique byte meanings', () => {
    const contract = standardCodeContract as StandardCodeContract

    expect(contract.version).toBe(1)
    expect(contract.layout).toBe('t1-mt1-byte-codec')
    expectUniqueCodecIndices(contract.awakeners)
    expectUniqueCodecIndices(contract.wheels)
    expectUniqueCodecIndices(contract.covenants)
    expectUniqueCodecIndices(contract.posses)
  })

  it('preserves V1 byte meanings and maps rows through current migration helpers', () => {
    const v1 = frozenContract as PersistenceContract
    const standardCode = standardCodeContract as StandardCodeContract
    const current = currentPersistenceContract as {
      awakeners: CurrentContractEntry[]
      wheels: CurrentContractEntry[]
      covenants: CurrentContractEntry[]
      posses: CurrentContractEntry[]
    }
    const currentIds = new Set([
      ...contractIds(current.awakeners),
      ...contractIds(current.wheels),
      ...contractIds(current.covenants),
      ...contractIds(current.posses),
    ])

    expect(
      standardCode.awakeners.map(({codecIndex, legacyId}) => ({codecIndex, legacyId})),
    ).toEqual(v1.awakeners.map(({id}) => ({codecIndex: id, legacyId: id})))
    expect(standardCode.wheels.map(({codecIndex, legacyId}) => ({codecIndex, legacyId}))).toEqual(
      v1.wheels.map((id, index) => ({codecIndex: index + 1, legacyId: id})),
    )
    expect(
      standardCode.covenants.map(({codecIndex, legacyId}) => ({codecIndex, legacyId})),
    ).toEqual(v1.covenants.map((id, index) => ({codecIndex: index + 1, legacyId: id})))
    expect(standardCode.posses.map(({codecIndex, legacyId}) => ({codecIndex, legacyId}))).toEqual(
      v1.posses.map(({id, index}) => ({codecIndex: index, legacyId: id})),
    )

    for (const entry of standardCode.awakeners) {
      expect(entry.id).toBe(migrateAwakenerIdV1ToCurrent(entry.legacyId))
      expect(currentIds.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.wheels) {
      expect(entry.id).toBe(migrateWheelIdV1ToCurrent(String(entry.legacyId)))
      expect(currentIds.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.covenants) {
      expect(entry.id).toBe(migrateCovenantIdV1ToCurrent(String(entry.legacyId)))
      expect(currentIds.has(entry.id)).toBe(true)
    }
    for (const entry of standardCode.posses) {
      expect(entry.id).toBe(migratePosseIdV1ToCurrent(String(entry.legacyId)))
      expect(currentIds.has(entry.id)).toBe(true)
    }
  })
})
