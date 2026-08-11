import {describe, expect, it} from 'vitest'

import {resolveAwakenerDatabaseState} from './awakener-database-state'
import {
  resolveDatabaseOverlay,
  resolveDatabaseReferenceInfoById,
  resolveDatabaseReferenceInfoByKindAndName,
} from './database-reference-info'
import type {DatabaseReferenceInfo} from './database-reference-layer'
import {hydrateGlobalDatabaseReferenceInfo} from './global-database-reference-layer'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

async function loadState(awakenerId: string, selectedEnlightenSlot: 'E3' | null = null) {
  const record = await loadPublicAwakenerDetailById(awakenerId)
  if (!record) throw new Error(`Missing parity record ${awakenerId}.`)
  return resolveAwakenerDatabaseState(record, {selectedEnlightenSlot})
}

async function expectNonblankReference(state: Awaited<ReturnType<typeof loadState>>, id: string) {
  const reference = resolveDatabaseReferenceInfoById(state.referenceLayer, id)
  expect(reference).toMatchObject({id})
  if (!reference) throw new Error(`Missing parity reference ${id}.`)
  const hydrated = await hydrateGlobalDatabaseReferenceInfo(
    reference,
    state.shellView.formulaContext,
    state.stats,
  )
  expect(hydrated.description).not.toBe('')
  return hydrated
}

describe('database reference product parity', () => {
  it('keeps global mechanics separate from same-name derived cards', async () => {
    const agrippa = await loadState('awakener-0002')
    expect(resolveDatabaseOverlay(agrippa.referenceLayer, 'Devour')?.id).toBe(
      'overlay.global.devour',
    )
    expect(
      resolveDatabaseReferenceInfoByKindAndName(agrippa.referenceLayer, 'derived-skill', 'Devour')
        ?.id,
    ).toBe('derived.global.devour-card')
    await expectNonblankReference(agrippa, 'overlay.global.devour')
    await expectNonblankReference(agrippa, 'derived.global.devour-card')
  })

  it('preserves Daffodil owner-local cards and global Vulnerable', async () => {
    const daffodil = await loadState('awakener-0012')
    for (const id of [
      'derived.daffodil.thousand-mirage',
      'derived.daffodil.thousand-mirage-effect-insight',
      'derived.daffodil.thousand-mirage-effect-vulnerable',
    ]) {
      await expectNonblankReference(daffodil, id)
    }
    expect(resolveDatabaseOverlay(daffodil.referenceLayer, 'Vulnerable')?.id).toBe(
      'overlay.global.vulnerable',
    )
    expect(
      resolveDatabaseReferenceInfoByKindAndName(daffodil.referenceLayer, 'derived-skill', 'Insight')
        ?.id,
    ).toBe('derived.daffodil.thousand-mirage-effect-insight')
    expect(
      resolveDatabaseReferenceInfoByKindAndName(
        daffodil.referenceLayer,
        'derived-skill',
        'Vulnerable',
      )?.id,
    ).toBe('derived.daffodil.thousand-mirage-effect-vulnerable')
  })

  it('keeps Tawil Silver Key Dawn owner-local and both STR directions linked', async () => {
    const [tawil, clementine] = await Promise.all([
      loadState('awakener-0047'),
      loadState('awakener-0010'),
    ])
    expect(
      resolveDatabaseReferenceInfoByKindAndName(
        tawil.referenceLayer,
        'derived-skill',
        'Silver Key Dawn',
      )?.id,
    ).toBe('derived.tawil.silver-key-dawn')
    expect(resolveDatabaseOverlay(clementine.referenceLayer, 'STR')?.id).toBe('overlay.global.str')
    expect(resolveDatabaseOverlay(clementine.referenceLayer, 'STR▼')?.id).toBe(
      'overlay.global.strength',
    )
  })

  it('reprojects Psychic Trauma base to E3 and back without losing content', async () => {
    const base = await loadState('awakener-0010')
    const upgraded = await loadState('awakener-0010', 'E3')
    const restored = await loadState('awakener-0010')
    const id = 'overlay.clementine.psychic-trauma'
    const baseDescription = (await expectNonblankReference(base, id)).description
    const upgradedDescription = getProjectedDescription(upgraded, id)
    const restoredDescription = (await expectNonblankReference(restored, id)).description

    expect(upgradedDescription).not.toBe(baseDescription)
    expect(restoredDescription).toBe(baseDescription)
  })
})

function getProjectedDescription(
  state: Awaited<ReturnType<typeof loadState>>,
  id: string,
): DatabaseReferenceInfo['description'] {
  const reference = resolveDatabaseReferenceInfoById(state.referenceLayer, id)
  expect(reference?.description).not.toBe('')
  if (!reference) throw new Error(`Missing parity reference ${id}.`)
  return reference.description
}
