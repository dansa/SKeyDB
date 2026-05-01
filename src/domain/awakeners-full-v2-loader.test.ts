import {describe, expect, it} from 'vitest'

import {loadAwakenerFullV2ById} from './awakeners-full-v2-loader'
import {loadPublicV2FullRecord} from './public-v2-loaders'

describe('awakeners-full-v2-loader', () => {
  it('loads individual records from public V2 chunks by canonical id', async () => {
    const publicRecord = await loadPublicV2FullRecord('awakeners', 'awakener-0001')

    await expect(loadAwakenerFullV2ById('awakener-0001')).resolves.toMatchObject({
      id: publicRecord?.numericId,
      displayName: publicRecord?.name,
      stats: publicRecord?.baseStatsLv1,
    })
  })

  it('composes public V2 detail records with cards, talents, enlightens, and upgrades', async () => {
    const thais = await loadAwakenerFullV2ById('awakener-0048')

    expect(thais?.cards.C4.id).toBe('skill.thais.ancient-caress')
    expect(thais?.cards.OverExalt?.id).toBe('skill.thais.sacred-relics-perpetuity')
    expect(thais?.talents.T2?.id).toBe('talent.thais.madness-omen')
    expect(thais?.talents.T3?.id).toBe('talent.thais.soulforge-aptitude')
    expect(thais?.enlightens.AbsoluteAxiom?.id).toBe('enlighten.thais.the-birthing-deep')
    expect(thais?.enlightens.E1.upgradeTargetIds).toContain('skill.thais.ancient-caress')
    expect(thais?.enlightens.E1.upgradePatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetId: 'skill.thais.ancient-caress',
          targetType: 'skill',
          operation: 'override_args',
        }),
      ]),
    )
    expect(thais?.derivedSkills.map((entry) => entry.id)).toContain('derived.thais.blood-of-fear')
  })

  it('maps public V2 promoted derived cards into the existing promoted extras surface', async () => {
    const castor = await loadAwakenerFullV2ById('awakener-0008')

    expect(castor?.cards.promotedExtras.map((entry) => entry.id)).toEqual([
      'derived.castor.onyx-plume',
    ])
  })

  it('translates public V2 card keyword upgrades for the existing resolver', async () => {
    const arachne = await loadAwakenerFullV2ById('awakener-0056')

    expect(arachne?.enlightens.E2.upgradePatches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetId: 'skill.arachne.fate-binding-web',
          targetType: 'skill',
          operation: 'card_keywords',
          addCardKeywords: [
            {id: 'mechanic.prepare', value: 1},
            {id: 'mechanic.retain'},
          ],
        }),
      ]),
    )
  })

  it('loads individual records from public V2 chunks by legacy numeric id', async () => {
    await expect(loadAwakenerFullV2ById(1)).resolves.toMatchObject({
      displayName: '"24"',
    })
  })

  it('returns undefined when no public V2 record exists for an id', async () => {
    await expect(loadAwakenerFullV2ById(99999)).resolves.toBeUndefined()
  })
})
