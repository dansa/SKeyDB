import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/repository'

import {
  getDerivedSkillById,
  getDerivedSkills,
  getDerivedSkillsForAwakener,
  getDerivedSkillsForRootSkill,
} from './derived-skills'

async function getDetailedDerivedSkills() {
  const derivedSkills = getDerivedSkills()
  return Promise.all(
    derivedSkills.map(async (derivedSkill) => {
      const detail = await loadPublicRecord('derived-skills', derivedSkill.id)
      return {
        ...derivedSkill,
        ...detail,
        displayName: derivedSkill.displayName,
        ownerAwakenerId: derivedSkill.ownerAwakenerId,
        variants: derivedSkill.variants,
      }
    }),
  )
}

describe('derived-skills', () => {
  const retainExhaustKeywords = expect.arrayContaining([
    {id: 'mechanic.retain'},
    {id: 'mechanic.exhaust'},
  ])

  it('loads canonical derived skill records from the normalized dataset', () => {
    const derivedSkills = getDerivedSkills()

    expect(derivedSkills.length).toBeGreaterThan(0)
    expect(derivedSkills[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
        derivedFromId: expect.any(String),
        rootSkillId: expect.any(String),
        childDerivedSkillIds: expect.any(Array),
      }),
    )
  })

  it('loads catalog-backed derived skills as lightweight adapter records', () => {
    const derivedSkills = getDerivedSkills()
    const bloodOfFear = getDerivedSkillById('derived.thais.blood-of-fear', derivedSkills)

    expect(bloodOfFear).toMatchObject({
      id: 'derived.thais.blood-of-fear',
      displayName: 'Blood of Fear',
      ownerAwakenerId: 48,
      derivedFromId: 'skill.thais.sacred-bloods-instinct',
      rootSkillId: 'skill.thais.sacred-bloods-instinct',
      cardKeywords: [],
      childDerivedSkillIds: [],
      descriptionArgs: {},
      descriptionTemplate: '',
      variants: [],
    })
    expect(bloodOfFear).not.toHaveProperty('schemaVersion')
  })

  it('preserves nested parent-child chains for public derived cards', () => {
    const derivedSkills = getDerivedSkills()

    expect(getDerivedSkillById('derived.hameln.symphony-of-harmony', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 22,
        nodeKind: 'group',
        rootSkillId: 'skill.hameln.laudable-masterpiece',
        derivedFromId: 'skill.hameln.laudable-masterpiece',
        childDerivedSkillIds: ['derived.hameln.ascending-scale', 'derived.hameln.descending-scale'],
      }),
    )

    expect(getDerivedSkillById('derived.miryam.divine-realms-illusion', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 32,
        nodeKind: 'group',
        rootSkillId: 'skill.miryam.testament-of-faith',
        derivedFromId: 'derived.miryam.the-end-of-belief',
        childDerivedSkillIds: [
          'derived.miryam.faith-of-the-divine-realm',
          'derived.miryam.call-of-the-divine-realm',
          'derived.miryam.divine-realms-descent',
        ],
      }),
    )

    expect(getDerivedSkillById('derived.tawil.six-wings', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 47,
        rootSkillId: 'skill.tawil.pinions-of-time',
        derivedFromId: 'derived.tawil.four-wings',
        childDerivedSkillIds: ['derived.tawil.memories'],
      }),
    )

    expect(getDerivedSkillById('derived.tawil.memories', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 47,
        nodeKind: 'group',
        rootSkillId: 'skill.tawil.pinions-of-time',
        derivedFromId: 'derived.tawil.six-wings',
        childDerivedSkillIds: [
          'derived.tawil.innocent-return-gift',
          'derived.tawil.mutated-heart',
          'derived.tawil.honey-mead',
          'derived.tawil.emissarys-verdict',
          'derived.tawil.utopian-veil',
          'derived.tawil.polar-dusklight',
        ],
      }),
    )

    expect(getDerivedSkillById('derived.doll-inferno.illusions-end', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 18,
        derivedFromId: 'talent.doll-inferno.path-of-annihilation',
        childDerivedSkillIds: [
          'derived.doll-inferno.self-destruct-finale',
          'derived.doll-inferno.fates-descent-finale',
        ],
      }),
    )

    expect(getDerivedSkillById('derived.daffodil.thousand-mirage', derivedSkills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 12,
        rootSkillId: 'skill.daffodil.sea-of-primordial-essence',
        derivedFromId: 'skill.daffodil.sea-of-primordial-essence',
        childDerivedSkillIds: [
          'derived.daffodil.thousand-mirage-base-cards',
          'derived.daffodil.thousand-mirage-extra-effects',
        ],
      }),
    )
  })

  it('supports lookup by owner awakener id and root skill id', () => {
    const derivedSkills = getDerivedSkills()

    expect(getDerivedSkillsForAwakener(32, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'derived.miryam.divine-realms-illusion',
        'derived.miryam.faith-of-the-divine-realm',
        'derived.miryam.call-of-the-divine-realm',
        'derived.miryam.divine-realms-descent',
        'derived.miryam.heretical-faith',
        'derived.miryam.iron-resolve',
        'derived.miryam.revelate-devotion',
        'derived.miryam.the-end-of-belief',
      ]),
    )

    expect(getDerivedSkillsForAwakener(18, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'derived.doll-inferno.illusions-end',
        'derived.doll-inferno.self-destruct-finale',
        'derived.doll-inferno.fates-descent-finale',
      ]),
    )

    expect(getDerivedSkillsForAwakener(19, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['derived.helot-catena.irregular-form-chains']),
    )

    expect(getDerivedSkillsForAwakener(12, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'derived.daffodil.thousand-mirage',
        'derived.daffodil.thousand-mirage-base-cards',
        'derived.daffodil.thousand-mirage-extra-effects',
        'derived.daffodil.thousand-mirage-poison',
        'derived.daffodil.thousand-mirage-counter',
        'derived.daffodil.thousand-mirage-damage',
      ]),
    )

    expect(getDerivedSkillsForAwakener(27, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['derived.kathigu-ra.hyperflare']),
    )

    expect(getDerivedSkillsForAwakener(47, derivedSkills).map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'derived.tawil.twin-wings',
        'derived.tawil.four-wings',
        'derived.tawil.six-wings',
        'derived.tawil.memories',
        'derived.tawil.innocent-return-gift',
        'derived.tawil.mutated-heart',
        'derived.tawil.honey-mead',
        'derived.tawil.emissarys-verdict',
        'derived.tawil.utopian-veil',
        'derived.tawil.polar-dusklight',
      ]),
    )

    expect(
      getDerivedSkillsForRootSkill('skill.salvador.end-of-suffering', derivedSkills).map(
        (entry) => entry.id,
      ),
    ).toEqual(
      expect.arrayContaining([
        'derived.salvador.dedication',
        'derived.salvador.liberation',
        'derived.salvador.redemption',
      ]),
    )

    expect(getDerivedSkillsForRootSkill('skill.faros.lost-city-of-lemuria', derivedSkills)).toEqual(
      [],
    )
  })

  it('preserves reviewed intrinsic keywords and fixed args for dedicated wiki-derived cards', async () => {
    const derivedSkills = await getDetailedDerivedSkills()

    expect(getDerivedSkillById('derived.hameln.symphony-of-harmony', derivedSkills)).toEqual(
      expect.objectContaining({
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.global.insight', derivedSkills)).toEqual(
      expect.objectContaining({
        displayName: 'Insight',
        descriptionTemplate: 'Draw 1 card and gain 1 Arithmetica.',
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.global.embryo', derivedSkills)).toEqual(
      expect.objectContaining({
        displayName: 'Embryo',
        descriptionTemplate:
          '{Caro} Awakeners consume this on Exalt to trigger {Devour}. On play: One Awakener gains [Energy:Arg1] Aliemus and +[Arg2]% Crit Rate this turn.',
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '30'},
          Arg2: {kind: 'fixed', value: '10', suffix: '%'},
        },
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.global.silver-key-gleam', derivedSkills)).toEqual(
      expect.objectContaining({
        displayName: 'Silver Key Gleam',
        descriptionTemplate: expect.any(String),
      }),
    )

    expect(getDerivedSkillById('derived.global.light-cone-boundary', derivedSkills)).toEqual(
      expect.objectContaining({
        displayName: 'Light Cone Boundary',
        descriptionTemplate: expect.any(String),
      }),
    )

    expect(getDerivedSkillById('derived.karen.marvelous-cuisine', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '3'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.jenkins.ultimate-assemble', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: 'X',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['30', '36', '42', '48', '54', '60'],
            suffix: '%',
            stat: 'ATK',
          },
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.jenkins.swarm-impact', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate:
          'Deal [Damage:Arg2] DMG to a random enemy [Arg1] {plural:[Arg1]|time|times}.',
        descriptionArgs: {
          Arg2: {
            kind: 'scaling',
            values: ['30', '36', '42', '48', '54', '60'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg1: {kind: 'fixed', value: '0'},
        },
        cost: '1',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.doresain.evernights-revel', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate: 'Deal [Damage:Arg1] {Pierce DMG} to all enemies.',
        descriptionArgs: {
          Arg1: {
            kind: 'fixed',
            value: '40',
            suffix: '%',
            stat: 'ATK',
          },
        },
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.daffodil.thousand-mirage-poison', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        descriptionTemplate:
          'Deal [Damage:Arg1] DMG. This DMG enjoys a [Arg2]x {STR} bonus. Inflict {Poison} equal to [Arg3]% DMG dealt.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['62.5', '75', '87.5', '100', '112.5', '125'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg2: {kind: 'fixed', value: '3'},
          Arg3: {kind: 'fixed', value: '50', suffix: '%'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.daffodil.thousand-mirage-counter', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '2',
        descriptionTemplate:
          'Deal [Damage:Arg1] DMG. This DMG enjoys a [Arg2]x {STR} bonus. Obtain {Temporary Counter} equal to [Arg3]% DMG dealt.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['100', '120', '140', '160', '180', '200'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg2: {kind: 'fixed', value: '4'},
          Arg3: {kind: 'fixed', value: '50', suffix: '%'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.daffodil.thousand-mirage-damage', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '4',
        descriptionTemplate: 'Deal [Damage:Arg1] DMG. This DMG receives a [Arg2]x {STR} bonus.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['200', '240', '280', '320', '360', '400'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg2: {kind: 'fixed', value: '6'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.castor.onyx-plume', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.vortice.vortex-shell', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: expect.objectContaining({
          Arg1: expect.objectContaining({
            stat: 'ATK',
            suffix: '%',
          }),
        }),
      }),
    )

    expect(getDerivedSkillById('derived.corposant.pilot', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: expect.objectContaining({
          Arg1: expect.objectContaining({
            kind: 'fixed',
            value: '20',
            suffix: '%',
            stat: 'DEF',
          }),
          Arg2: {
            kind: 'fixed',
            value: '4',
            suffix: '%',
            stat: 'ATK',
          },
        }),
      }),
    )

    expect(getDerivedSkillById('derived.salvador.sanctuary-of-mercy', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '1'},
          Arg2: {kind: 'fixed', value: '100'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.thais.scion-of-purity', derivedSkills)).toEqual(
      expect.objectContaining({
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.tawil.echoes-of-the-past', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.tawil.innocent-return-gift', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        descriptionTemplate: 'Choose an Awakener to gain [Energy:Arg1] Aliemus.',
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '60'},
        },
        cardKeywords: [],
      }),
    )

    expect(getDerivedSkillById('derived.tawil.emissarys-verdict', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        descriptionTemplate:
          "Deal [Arg1]% of the target's max HP as {Fixed DMG} to the enemy in the last row. This DMG cannot be less than 300% of your own max HP.",
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '15', suffix: '%'},
        },
        cardKeywords: [],
      }),
    )

    expect(getDerivedSkillById('derived.miryam.heretical-faith', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '6',
        descriptionArgs: {
          Arg3: {
            kind: 'scaling',
            values: ['25', '30', '35', '40', '45', '50'],
          },
        },
        cardKeywords: expect.arrayContaining([
          {id: 'mechanic.retain'},
          {id: 'mechanic.exhaust'},
          {id: 'mechanic.prepare', value: 3},
        ]),
      }),
    )

    expect(getDerivedSkillById('derived.miryam.the-end-of-belief', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '9',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['25', '30', '35', '40', '45', '50'],
          },
        },
        cardKeywords: expect.arrayContaining([
          {id: 'mechanic.retain'},
          {id: 'mechanic.exhaust'},
          {id: 'mechanic.prepare', value: 3},
        ]),
      }),
    )

    expect(getDerivedSkillById('derived.miryam.iron-resolve', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['35', '42', '49', '56', '63', '70'],
            suffix: '%',
            stat: 'DEF',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.miryam.revelate-devotion', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate:
          'Gain [Power:Arg1] {STR} and [TentaclePower:Arg1] {Tentacle DMG} at turn start.',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['1.75', '2.1', '2.45', '2.8', '3.15', '3.5'],
            suffix: '%',
            stat: 'ATK',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.miryam.faith-of-the-divine-realm', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '25'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.miryam.call-of-the-divine-realm', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '25'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.miryam.divine-realms-descent', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '25'},
        },
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.mouchette.dramatic-encounter', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '30', suffix: '%', stat: 'ATK'},
          Arg2: {kind: 'fixed', value: '1'},
        },
      }),
    )

    expect(getDerivedSkillById('derived.thais.blood-of-fear', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '1'},
        },
      }),
    )

    expect(getDerivedSkillById('derived.thais.blood-of-decay', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '1'},
        },
      }),
    )

    expect(getDerivedSkillById('derived.thais.blood-of-coition', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '20'},
        },
      }),
    )

    expect(getDerivedSkillById('derived.xu.betroth', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {kind: 'fixed', value: '6'},
        },
      }),
    )
    expect(getDerivedSkillById('derived.xu.enthrall', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: expect.objectContaining({
          Arg1: {kind: 'fixed', value: '1', suffix: '%'},
          Arg2: {kind: 'fixed', value: '40', suffix: '%'},
        }),
      }),
    )

    expect(getDerivedSkillById('derived.wanda.echoes-of-whispers', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          StateArg3: {kind: 'fixed', value: '60', suffix: '%'},
        },
      }),
    )

    expect(getDerivedSkillById('derived.wanda.slumber-counter', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate:
          'Consume 5 stacks of {Dreamlure}, Wanda obtains [StateArg1] Aliemus, and gains Temporary {Counter} equal to [StateArg2]% of permanent {Counter}.',
        descriptionArgs: {
          StateArg1: {
            kind: 'scaling',
            values: ['10', '11', '12', '13', '14', '15'],
          },
          StateArg2: {
            kind: 'scaling',
            values: ['35', '38', '41', '44', '47', '50'],
            suffix: '%',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.doll-inferno.elation', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg2: {
            kind: 'scaling',
            values: ['35', '38', '41', '44', '47', '50'],
            suffix: '%',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.doll-inferno.curse', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg2: {
            kind: 'scaling',
            values: ['20', '24', '28', '32', '36', '40'],
            suffix: '%',
            stat: 'DEF',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.daffodil.thousand-mirage', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate:
          'Customize a {Thousand Mirage} card by choosing a base card and adding extra effects.',
      }),
    )

    expect(getDerivedSkillById('derived.doll-inferno.self-destruct-finale', derivedSkills)).toEqual(
      expect.objectContaining({
        rootSkillId: 'skill.doll-inferno.self-destruct',
        cost: '2',
      }),
    )

    expect(getDerivedSkillById('derived.doll-inferno.fates-descent-finale', derivedSkills)).toEqual(
      expect.objectContaining({
        rootSkillId: 'skill.doll-inferno.fates-descent',
        cost: '3',
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['35', '38', '41', '44', '47', '50'],
          },
          Arg2: {
            kind: 'scaling',
            values: ['30', '36', '42', '48', '54', '60'],
            suffix: '%',
            stat: 'ATK',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.helot-catena.bloodthirsty-flail', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '4',
        cardKeywords: expect.arrayContaining([
          {id: 'mechanic.prepare', value: 1},
          {id: 'mechanic.retain'},
        ]),
      }),
    )

    expect(getDerivedSkillById('derived.doresain.evernights-revel', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionTemplate: 'Deal [Damage:Arg1] {Pierce DMG} to all enemies.',
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.goliath.usurp', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: expect.objectContaining({
          Arg1: {
            kind: 'scaling',
            values: ['40', '44', '48', '52', '56', '60'],
            suffix: '%',
          },
        }),
      }),
    )

    expect(getDerivedSkillById('derived.tawil.twin-wings', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['20', '24', '28', '32', '36', '40'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg2: {
            kind: 'scaling',
            values: ['10', '12', '14', '16', '18', '20'],
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.tawil.four-wings', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['25', '30', '35', '40', '45', '50'],
            suffix: '%',
            stat: 'ATK',
          },
          Arg2: {
            kind: 'scaling',
            values: ['5', '6', '7', '8', '9', '10'],
            suffix: '%',
            stat: 'ATK',
          },
        },
      }),
    )

    expect(getDerivedSkillById('derived.tawil.echoes-of-the-past', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '0',
        cardKeywords: retainExhaustKeywords,
      }),
    )

    expect(getDerivedSkillById('derived.pollux.sacred-heart', derivedSkills)).toEqual(
      expect.objectContaining({
        cost: '1',
        cardKeywords: expect.arrayContaining([
          {id: 'mechanic.prepare', value: 1},
          {id: 'mechanic.retain'},
        ]),
      }),
    )

    expect(getDerivedSkillById('derived.tawil.six-wings', derivedSkills)).toEqual(
      expect.objectContaining({
        descriptionArgs: {
          Arg1: {
            kind: 'scaling',
            values: ['30', '36', '42', '48', '54', '60'],
            suffix: '%',
            stat: 'ATK',
          },
        },
      }),
    )
  })

  it('keeps canonical ids aligned with source-backed display names', () => {
    const derivedSkills = getDerivedSkills()
    const mismatches = derivedSkills.filter((entry) => {
      const slug = entry.id.split('.').slice(2).join('.')
      const normalizedDisplayName = entry.displayName
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[:\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      return (
        slug !== normalizedDisplayName &&
        !(
          normalizedDisplayName.endsWith('-countdown') &&
          slug === `countdown-${normalizedDisplayName.split('-')[0]}`
        ) &&
        !slug.endsWith(`-${normalizedDisplayName}`) &&
        !slug.includes(`${normalizedDisplayName}-`) &&
        !(
          normalizedDisplayName.startsWith('conversion-') &&
          slug === normalizedDisplayName.slice('conversion-'.length)
        )
      )
    })

    expect(mismatches).toEqual([])
  })
})
