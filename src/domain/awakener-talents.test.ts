import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/repository'

import {getAwakenerKits} from './awakener-kits'
import {
  getAwakenerTalentById,
  getAwakenerTalents,
  getAwakenerTalentsForAwakener,
} from './awakener-talents'

describe('awakener-talents', () => {
  it('loads canonical talent records from the normalized dataset', () => {
    const talents = getAwakenerTalents()

    expect(talents.length).toBeGreaterThan(0)
    expect(talents[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerAwakenerId: expect.any(Number),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
      }),
    )
  })

  it('loads catalog-backed talents as lightweight adapter records', () => {
    const talents = getAwakenerTalents()
    const madnessOmen = getAwakenerTalentById('talent.24.madness-omen', talents)

    expect(madnessOmen).toMatchObject({
      id: 'talent.24.madness-omen',
      displayName: 'Madness Omen',
      ownerAwakenerId: 1,
      descriptionArgs: {},
      descriptionTemplate: '',
      hasLevelScaledDescription: true,
    })
    expect(madnessOmen).not.toHaveProperty('schemaVersion')
  })

  it('preserves public Gnostic Potential metadata for level defaults', () => {
    const talents = getAwakenerTalents()
    const limitedGnostic = getAwakenerTalentById('talent.24.gnostic-potential', talents)
    const permanentGnostic = getAwakenerTalentById('talent.agrippa.gnostic-potential', talents)

    expect(limitedGnostic).toMatchObject({
      id: 'talent.24.gnostic-potential',
      displayName: 'Gnostic Potential',
      ownerAwakenerId: 1,
      family: 'gnostic_potential',
      maxLevel: 5,
      defaultMaxed: true,
      hasLevelScaledDescription: true,
    })
    expect(permanentGnostic).toMatchObject({
      id: 'talent.agrippa.gnostic-potential',
      family: 'gnostic_potential',
      maxLevel: 5,
      hasLevelScaledDescription: true,
    })
    expect(permanentGnostic).not.toHaveProperty('defaultMaxed')
  })

  it('matches every tracked kit talent binding to a seeded record', () => {
    const talents = getAwakenerTalents()
    const kits = getAwakenerKits()
    const ids = new Set(talents.map((entry) => entry.id))

    kits.forEach((kit) => {
      Object.values(kit.talents).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((talentId) => {
            expect(ids.has(talentId)).toBe(true)
          })
          return
        }

        if (value) {
          expect(ids.has(value)).toBe(true)
        }
      })
    })
  })

  it('preserves public slot coverage and soulforge metadata', async () => {
    const talents = getAwakenerTalents()

    expect(getAwakenerTalentById('talent.corposant.cinders', talents)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 11,
        displayName: 'Cinders',
      }),
    )

    const madnessOmen = await loadPublicRecord('talents', 'talent.24.madness-omen')
    const xuSoulforge = await loadPublicRecord('talents', 'talent.xu.soulforge-aptitude')

    expect(madnessOmen).toEqual(
      expect.objectContaining({
        maxLevel: 12,
        descriptionArgs: {
          Arg1: {
            kind: 'linear',
            base: '5',
            gainPerLevel: '5',
          },
        },
      }),
    )

    expect(xuSoulforge).toEqual(
      expect.objectContaining({
        maxLevel: 10,
        hasLevelScaledDescription: true,
        descriptionArgs: expect.objectContaining({
          Arg1: {
            kind: 'linear',
            base: '3',
            gainPerLevel: '3',
          },
          Arg2: {
            kind: 'linear',
            base: '50',
            gainPerLevel: '50',
          },
          Arg3: {
            kind: 'scaling',
            values: ['5', '7', '9', '11', '13', '15', '17', '19', '21', '25'],
          },
        }),
      }),
    )
  })

  it('supports lookup by owner awakener id', () => {
    const talents = getAwakenerTalents()
    const doresainTalents = getAwakenerTalentsForAwakener(14, talents)

    expect(doresainTalents.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'talent.doresain.casket-harvest',
        'talent.doresain.festering-grace',
        'talent.doresain.madness-omen',
        'talent.doresain.soulforge-aptitude',
      ]),
    )
  })

  it('stores multiline descriptions as real newlines instead of escaped literals', async () => {
    const murphyFauxbornTalent = await loadPublicRecord(
      'talents',
      'talent.murphy-fauxborn.lightless-bottom',
    )

    expect(murphyFauxbornTalent?.descriptionTemplate).toContain('\n')
    expect(murphyFauxbornTalent?.descriptionTemplate).not.toContain('\\n')
    expect(murphyFauxbornTalent?.descriptionTemplate).toContain(
      'Realm Mastery is counted as {Benthos: Aequor Mastery}.',
    )
  })

  it('loads talent records without synthesized target-side upgrade patch fields', () => {
    const talents = getAwakenerTalents()

    for (const talentId of [
      'talent.agrippa.seal-of-the-pact',
      'talent.caecus.rebellious-spikes',
      'talent.corposant.cinders',
      'talent.ramona.silverheart-resonance',
      'talent.wanda.revelation',
      'talent.casiah.master-of-magic',
    ]) {
      const talent = getAwakenerTalentById(talentId, talents) as Record<string, unknown> | undefined
      expect(talent).toBeDefined()
      expect(talent).not.toHaveProperty('upgradeTargetIds')
      expect(talent).not.toHaveProperty('upgradePatches')
    }
  })
})
