import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/repository'

import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

describe('public-detail-record-adapters', () => {
  it('loads individual records from public chunks by canonical id', async () => {
    const publicRecord = await loadPublicRecord('awakeners', 'awakener-0001')

    await expect(loadPublicAwakenerDetailById('awakener-0001')).resolves.toMatchObject({
      id: publicRecord?.numericId,
      displayName: publicRecord?.name,
      stats: expect.objectContaining({
        CON: '52',
        ATK: '66',
        DEF: '30',
      }),
    })
  })

  it('composes public detail records with cards, talents, enlightens, and upgrades', async () => {
    const thais = await loadPublicAwakenerDetailById('awakener-0048')

    expect(thais?.cards.C4.id).toBe('skill.thais.ancient-caress')
    expect(thais?.stats).toMatchObject({
      CON: '49',
      ATK: '47',
      DEF: '44',
      CritRate: '5%',
      CritDamage: '50%',
      AliemusRegen: '2.4',
      KeyflareRegen: '29.4',
    })
    expect(thais?.substatScaling).toEqual({
      AliemusRegen: '0.4',
      KeyflareRegen: '2.4',
    })
    expect(thais?.cards.OverExalt?.id).toBe('skill.thais.sacred-relics-perpetuity')
    expect(thais?.talents.T2?.id).toBe('talent.thais.madness-omen')
    expect(thais?.talents.T3?.id).toBe('talent.thais.soulforge-aptitude')
    expect(thais?.enlightens.AbsoluteAxiom?.id).toBe('enlighten.thais.the-birthing-deep')
    expect(thais?.cards.C4.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.thais.forests-embrace',
          operation: 'override_args',
        }),
      ]),
    )
    expect(thais?.derivedSkills.map((entry) => entry.id)).toContain('derived.thais.blood-of-fear')
  })

  it('maps promoted derived cards into the existing promoted extras surface', async () => {
    const castor = await loadPublicAwakenerDetailById('awakener-0008')

    expect(castor?.cards.promotedExtras.map((entry) => entry.id)).toEqual([
      'derived.castor.onyx-plume',
    ])
    expect(castor?.derivedSkills.map((entry) => entry.id)).not.toContain(
      'derived.castor.onyx-plume',
    )
  })

  it('keeps card keyword upgrades on the upgraded target record', async () => {
    const arachne = await loadPublicAwakenerDetailById('awakener-0056')

    expect(arachne?.cards.C5.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.arachne.universe-as-i-conceive',
          operation: 'override_card_keywords',
          patch: expect.objectContaining({
            cardKeywords: [{id: 'mechanic.prepare', value: 1}, {id: 'mechanic.retain'}],
          }),
        }),
      ]),
    )
  })

  it('keeps overlay upgrades on the upgraded overlay record', async () => {
    const xu = await loadPublicAwakenerDetailById('awakener-0054')

    const spellbound = xu?.overlays?.find((overlay) => overlay.id === 'overlay.xu.spellbound')
    expect(spellbound?.upgrades).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          upgraderId: 'enlighten.xu.nirvanas-kiss',
          operation: 'override_args',
          patch: expect.objectContaining({
            descriptionArgs: expect.objectContaining({
              DescArg2: {
                kind: 'fixed',
                value: '10',
              },
            }),
          }),
        }),
      ]),
    )
  })

  it('keeps link-only talent influences on the upgraded target record', async () => {
    const agrippa = await loadPublicAwakenerDetailById('awakener-0002')

    expect(agrippa?.talents.T1?.id).toBe('talent.agrippa.seal-of-the-pact')
    expect(agrippa?.cards.Exalt.upgrades).toEqual([
      expect.objectContaining({
        operation: 'link_only',
        upgraderId: 'talent.agrippa.seal-of-the-pact',
      }),
    ])
  })

  it('loads individual records from public chunks by numeric awakener id', async () => {
    await expect(loadPublicAwakenerDetailById(1)).resolves.toMatchObject({
      displayName: '"24"',
    })
  })

  it('returns undefined when no public record exists for an id', async () => {
    await expect(loadPublicAwakenerDetailById(99999)).resolves.toBeUndefined()
  })
})
