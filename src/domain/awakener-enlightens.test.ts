import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {getAwakenerEnlightenById, getAwakenerEnlightens} from './awakener-enlightens'
import {getAwakenerKits} from './awakener-kits'

describe('awakener-enlightens', () => {
  it('loads canonical enlighten records from the normalized dataset', () => {
    const enlightens = getAwakenerEnlightens()

    expect(enlightens.length).toBeGreaterThan(0)
    expect(enlightens[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerAwakenerId: expect.any(Number),
        slot: expect.any(String),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
      }),
    )
  })

  it('loads catalog-backed enlightens as lightweight adapter records', () => {
    const enlightens = getAwakenerEnlightens()
    const birthingDeep = getAwakenerEnlightenById('enlighten.thais.the-birthing-deep', enlightens)

    expect(birthingDeep).toMatchObject({
      id: 'enlighten.thais.the-birthing-deep',
      displayName: 'The Birthing Deep',
      ownerAwakenerId: 48,
      slot: 'AbsoluteAxiom',
      descriptionArgs: {},
      descriptionTemplate: '',
    })
    expect(birthingDeep).not.toHaveProperty('schemaVersion')
  })

  it('matches every tracked kit enlighten binding to a seeded record', () => {
    const enlightens = getAwakenerEnlightens()
    const kits = getAwakenerKits()
    const ids = new Set(enlightens.map((entry) => entry.id))

    kits.forEach((kit) => {
      Object.values(kit.enlightens).forEach((enlightenId) => {
        expect(ids.has(enlightenId)).toBe(true)
      })
    })
  })

  it('keeps public absolute axioms without synthesizing target-side upgrade links', () => {
    const enlightens = getAwakenerEnlightens()

    expect(getAwakenerEnlightenById('enlighten.aurita.sparkling-friendship', enlightens)).toEqual(
      expect.objectContaining({
        slot: 'AbsoluteAxiom',
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.erica.final-decree', enlightens)).toEqual(
      expect.objectContaining({
        slot: 'AbsoluteAxiom',
      }),
    )

    expect(getAwakenerEnlightenById('enlighten.daffodil.essence-sediment', enlightens)).toEqual(
      expect.objectContaining({slot: 'E3'}),
    )
  })

  it('does not synthesize target-side public V3 upgrades onto aggregate enlightens', () => {
    const enlightens = getAwakenerEnlightens()

    for (const id of [
      'enlighten.24.hysteria',
      'enlighten.alva.unyielding-bastion',
      'enlighten.24.restraint-bonds',
    ]) {
      expect(getAwakenerEnlightenById(id, enlightens)).toBeDefined()
    }
  })

  it('cleans malformed quote-heavy enlighten descriptions into canonical rich-text terms', async () => {
    expect(
      (await loadPublicRecord('enlightens', 'enlighten.clementine.you-will-recover'))
        ?.descriptionTemplate,
    ).toBe(
      'At turn end, obtain 2 stacks of {Symbiosis}. The stacking limit for {Symbiosis}, {Psychic Trauma}, and {Phobic Fixation} is increased to 15.',
    )

    expect(
      (await loadPublicRecord('enlightens', 'enlighten.karen.creamy-frosting'))
        ?.descriptionTemplate,
    ).toBe('"The {Toad Stew}"\'s {Poison} and HP Recovery effects +50%.')
  })

  it('does not synthesize overlay upgrade patches onto aggregate enlightens', () => {
    const enlightens = getAwakenerEnlightens()

    for (const id of [
      'enlighten.hameln.oneiric-waltz',
      'enlighten.wanda.lakeborne-dweller',
      'enlighten.xu.nirvanas-kiss',
    ]) {
      expect(getAwakenerEnlightenById(id, enlightens)).toBeDefined()
    }
  })
})
