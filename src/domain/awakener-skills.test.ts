import {describe, expect, it} from 'vitest'

import {loadPublicRecord} from '@/data-access/public-data/repository'

import {getAwakenerKits} from './awakener-kits'
import {
  getAwakenerSkillById,
  getAwakenerSkills,
  getAwakenerSkillsForAwakener,
} from './awakener-skills'
import {getDerivedSkills} from './derived-skills'

async function getDetailedAwakenerSkills() {
  const skills = getAwakenerSkills()
  return Promise.all(
    skills.map(async (skill) => {
      const detail = await loadPublicRecord('skills', skill.id)
      return {
        ...skill,
        ...detail,
        displayName: skill.displayName,
        kind: skill.kind,
        ownerAwakenerId: skill.ownerAwakenerId,
        variants: skill.variants,
      }
    }),
  )
}

describe('awakener-skills', () => {
  it('loads canonical skill records from the normalized dataset', () => {
    const skills = getAwakenerSkills()

    expect(skills.length).toBeGreaterThan(0)
    expect(skills[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        ownerAwakenerId: expect.any(Number),
        kind: expect.any(String),
        displayName: expect.any(String),
        descriptionTemplate: expect.any(String),
        descriptionArgs: expect.any(Object),
        variants: expect.any(Array),
      }),
    )
  })

  it('loads catalog-backed skills as lightweight adapter records', () => {
    const skills = getAwakenerSkills()
    const skill = getAwakenerSkillById('skill.24.mediating-personalities', skills)

    expect(skill).toMatchObject({
      id: 'skill.24.mediating-personalities',
      displayName: 'Mediating Personalities',
      ownerAwakenerId: 1,
      kind: 'rouse',
      cardKeywords: [],
      descriptionArgs: {},
      descriptionTemplate: '',
      variants: [],
    })
    expect(skill).not.toHaveProperty('schemaVersion')
  })

  it('matches every tracked kit card binding to a seeded record', () => {
    const skills = getAwakenerSkills()
    const derivedSkills = getDerivedSkills()
    const kits = getAwakenerKits()
    const skillIds = new Set(skills.map((entry) => entry.id))
    const derivedSkillIds = new Set(derivedSkills.map((entry) => entry.id))

    kits.forEach((kit) => {
      kit.cards.promotedExtras.forEach((derivedSkillId) => {
        expect(derivedSkillIds.has(derivedSkillId)).toBe(true)
      })
      ;['C1', 'C2', 'C3', 'C4', 'C5', 'Exalt', 'OverExalt'].forEach((slotKey) => {
        const value = kit.cards[slotKey as keyof typeof kit.cards]
        if (typeof value === 'string') {
          expect(skillIds.has(value)).toBe(true)
        }
      })
    })
  })

  it('preserves slot semantics and source-backed naming for public skills', async () => {
    const skills = await getDetailedAwakenerSkills()
    const mediatingPersonalities = getAwakenerSkillById('skill.24.mediating-personalities', skills)
    const strike24 = getAwakenerSkillById('skill.24.strike', skills)
    const frenzy24 = getAwakenerSkillById('skill.24.frenzied-slash', skills)
    const twistedCarrionRevel = getAwakenerSkillById('skill.24.twisted-carrion-revel', skills)

    expect(mediatingPersonalities).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 1,
        kind: 'rouse',
        displayName: 'Mediating Personalities',
      }),
    )
    expect(mediatingPersonalities?.descriptionTemplate).toContain('{Chaos}:')
    expect(mediatingPersonalities?.descriptionTemplate).toContain('[StateArg4]%')
    expect(mediatingPersonalities?.descriptionTemplate).toContain(
      'Shuffle 1 {Insight} into the Discard Pile at turn end, Hand Limit +2.',
    )
    expect(strike24?.descriptionTemplate).toContain(
      'Depressed Persona: Gain an additional [DescArg1] Aliemus.',
    )
    expect(strike24?.descriptionTemplate).toContain(
      'Manic Persona: Deal [DescArg2] additional instance of DMG',
    )
    expect(frenzy24?.descriptionTemplate).toContain('obtain Temporary {Retain}')
    expect(frenzy24?.descriptionTemplate).toContain('Manic Persona: DMG instances +[DescArg2]')
    expect(twistedCarrionRevel?.descriptionTemplate).toContain(
      '"24" switches between Depressed and Manic Personas. Trigger additional effects based on the current {Realm and Persona}.',
    )
    expect(twistedCarrionRevel?.descriptionTemplate).toContain('{Realm and Persona}')
    expect(twistedCarrionRevel?.descriptionArgs).toEqual({
      Arg1: {
        kind: 'scaling',
        values: ['75', '90', '105', '120', '135', '150'],
        suffix: '%',
        stat: 'ATK',
      },
    })
    expect(twistedCarrionRevel?.cost).toBe('100')

    expect(getAwakenerSkillById('skill.erica.multiple-calculations', skills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 15,
        kind: 'over_exalt',
        displayName: 'Multiple Calculations',
      }),
    )

    expect(getAwakenerSkillById('skill.ogier.resolute-devotion', skills)).toEqual(
      expect.objectContaining({
        ownerAwakenerId: 38,
        kind: 'over_exalt',
        displayName: 'Resolute Devotion',
      }),
    )
    expect(getAwakenerSkillById('skill.agrippa.pale-blessing', skills)?.cost).toBe('100')
    expect(getAwakenerSkillById('skill.erica.electromagnetic-blast', skills)?.cost).toBe('100')
    expect(getAwakenerSkillById('skill.miryam.pray-to-the-abyss', skills)?.cost).toBe('100')
    expect(getAwakenerSkillById('skill.vortice.abyssal-vortex-cannon', skills)?.cost).toBe('200')
    expect(
      getAwakenerSkillById('skill.vortice.abyssal-vortex-cannon', skills)?.descriptionTemplate,
    ).toContain('Sacrifice up to 3 additional Permanent Tentacles')
    expect(getAwakenerSkillById('skill.24.symbiotic-aberration', skills)?.cost).toBe('2')
    expect(getAwakenerSkillById('skill.24.frenzied-slash', skills)?.cost).toBe('3')
    expect(getAwakenerSkillById('skill.24.mediating-personalities', skills)?.cost).toBe('2')
    expect(getAwakenerSkillById('skill.24.strike', skills)?.cost).toBe('1')
    expect(getAwakenerSkillById('skill.24.defense', skills)?.cost).toBe('1')
    expect(getAwakenerSkillById('skill.aurita.defense', skills)?.descriptionArgs.Arg1).toEqual({
      kind: 'scaling',
      values: ['10', '12', '14', '16', '18', '20'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(getAwakenerSkillById('skill.erica.unleash-mecha', skills)?.cost).toBe('0')
    expect(getAwakenerSkillById('skill.erica.function-overload', skills)?.cost).toBe('X')
    expect(getAwakenerSkillById('skill.helot-catena.crimson-shackles', skills)?.cost).toBe('1')

    expect(getAwakenerSkillsForAwakener(1, skills).map((entry) => entry.id)).toEqual([
      'skill.24.mediating-personalities',
      'skill.24.strike',
      'skill.24.defense',
      'skill.24.symbiotic-aberration',
      'skill.24.frenzied-slash',
      'skill.24.twisted-carrion-revel',
      'skill.24.aberrant-vivisection',
    ])
  })

  it('supports lookup by owner awakener id', () => {
    const skills = getAwakenerSkills()
    const miryamSkills = getAwakenerSkillsForAwakener(32, skills)

    expect(miryamSkills.map((entry) => entry.id)).toEqual(
      expect.arrayContaining([
        'skill.miryam.testament-of-faith',
        'skill.miryam.strike',
        'skill.miryam.defense',
        'skill.miryam.exalted-pyre',
        'skill.miryam.the-chosen-one',
        'skill.miryam.pray-to-the-abyss',
        'skill.miryam.unacquainted-pain',
      ]),
    )
  })

  it('keeps canonical ids aligned with source-backed display names', () => {
    const skills = getAwakenerSkills()
    const mismatches = skills.filter((entry) => {
      const slug = entry.id.split('.').slice(2).join('.')
      const normalizedDisplayName = entry.displayName
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[:\s]+/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      return slug !== normalizedDisplayName
    })

    expect(mismatches).toEqual([])
  })

  it('keeps upgrade-only keyword tags off base cards and baseline stacks honest', async () => {
    const skills = await getDetailedAwakenerSkills()

    expect(getAwakenerSkillById('skill.caecus.protective-scales', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.caecus.strike', skills)?.descriptionArgs.Arg3).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        value: '0',
      }),
    )
    expect(
      getAwakenerSkillById('skill.caecus.protective-scales', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(getAwakenerSkillById('skill.celeste.tintless-dream', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.celeste.tintless-dream', skills)?.descriptionTemplate,
    ).toContain('dealing [Arg3]% {Tentacle DMG}.')
    expect(
      getAwakenerSkillById('skill.doll-inferno.self-destruct', skills)?.descriptionTemplate,
    ).toContain('{Self-Destruct: Finale}')
    expect(
      getAwakenerSkillById('skill.doll-inferno.fates-descent', skills)?.descriptionTemplate,
    ).toContain("{Fate's Descent: Finale}")
    expect(
      getAwakenerSkillById('skill.celeste.tintless-dream', skills)?.descriptionArgs.Arg3,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '0'}))
    expect(getAwakenerSkillById('skill.celeste.strike', skills)?.descriptionArgs.Arg3).toEqual(
      expect.objectContaining({kind: 'fixed', value: '0'}),
    )
    expect(getAwakenerSkillById('skill.celeste.defense', skills)?.descriptionArgs.Arg3).toEqual(
      expect.objectContaining({kind: 'fixed', value: '0'}),
    )
    expect(
      getAwakenerSkillById('skill.celeste.everlasting-phantasm', skills)?.descriptionArgs.Arg3,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '0'}))
    expect(
      getAwakenerSkillById('skill.celeste.undying-bird-of-paradise', skills)?.cardKeywords,
    ).toEqual([])
    expect(
      getAwakenerSkillById('skill.celeste.everlasting-phantasm', skills)?.cardKeywords,
    ).toEqual([])
    expect(getAwakenerSkillById('skill.clementine.pain-extraction', skills)?.cardKeywords).toEqual(
      expect.arrayContaining([{id: 'mechanic.retain'}, {id: 'mechanic.prepare', value: 1}]),
    )
    expect(
      getAwakenerSkillById('skill.corposant.lightning-retribution', skills)?.cardKeywords,
    ).toEqual(expect.arrayContaining([{id: 'mechanic.retain'}, {id: 'mechanic.prepare', value: 1}]))
    expect(getAwakenerSkillById('skill.karen.silent-fealty', skills)?.descriptionArgs.Arg3).toEqual(
      {
        kind: 'fixed',
        value: '2',
      },
    )
    expect(
      getAwakenerSkillById('skill.thais.ritual-of-abundance', skills)?.descriptionArgs.Arg6,
    ).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(getAwakenerSkillById('skill.agrippa.path-of-the-lost', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(getAwakenerSkillById('skill.aurita.self-proliferation', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.caecus.metamorphosed-body', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['7', '8.4', '9.8', '11.2', '12.6', '14'],
      suffix: '%',
      stat: 'CON',
    })
    expect(
      getAwakenerSkillById('skill.agrippa.pale-blessing', skills)?.descriptionArgs.Arg2,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['40', '48', '56', '64', '72', '80'],
        suffix: '%',
        stat: 'DEF',
        substatBonus: {
          substat: 'SigilYield',
          multiplier: '0.5',
          mode: 'scale_base',
        },
      }),
    )
    expect(
      getAwakenerSkillById('skill.agrippa.pale-blessing', skills)?.descriptionArgs.Arg3,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['75', '90', '105', '120', '135', '150'],
        suffix: '%',
        stat: 'ATK',
        substatBonus: {
          substat: 'SigilYield',
          multiplier: '1',
          mode: 'scale_base',
        },
      }),
    )
    expect(
      getAwakenerSkillById('skill.caecus.metamorphosed-body', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'scaling',
      values: ['10', '12', '14', '16', '18', '20'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.agrippa.pale-blessing', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.aurita.clamorous-ocean', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.miryam.exalted-pyre', skills)?.descriptionArgs.Arg4).toEqual(
      {
        kind: 'scaling',
        values: ['3.75', '4.5', '5.25', '6', '6.75', '7.5'],
        suffix: '%',
        stat: 'ATK',
      },
    )
    expect(
      getAwakenerSkillById('skill.casiah.magic-carnival', skills)?.descriptionArgs.Arg3,
    ).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        substatBonus: {
          substat: 'RealmMastery',
          multiplier: '0.2',
        },
      }),
    )
    expect(getAwakenerSkillById('skill.24.strike', skills)?.descriptionArgs.Arg2).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
    })
    expect(getAwakenerSkillById('skill.24.defense', skills)?.descriptionArgs.Arg2).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
    })
    expect(
      getAwakenerSkillById('skill.miryam.pray-to-the-abyss', skills)?.descriptionArgs.Arg5,
    ).toEqual({
      kind: 'scaling',
      values: ['30', '36', '42', '48', '54', '60'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'CritDamage',
        multiplier: '0.2',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.miryam.pray-to-the-abyss', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['7.5', '9', '10.5', '12', '13.5', '15'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'CritDamage',
        multiplier: '0.2',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.miryam.pray-to-the-abyss', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['10', '11', '12', '13', '14', '15'],
      substatBonus: {
        substat: 'CritDamage',
        multiplier: '0.2',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.miryam.pray-to-the-abyss', skills)?.descriptionArgs.Arg3,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['75', '80', '85', '90', '95', '100'],
      }),
    )
    expect(getAwakenerSkillById('skill.ramona.queens-sword', skills)?.descriptionArgs.Arg1).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['15', '18', '21', '24', '27', '30'],
        suffix: '%',
        stat: 'ATK',
      }),
    )
    expect(getAwakenerSkillById('skill.ramona.queens-sword', skills)?.descriptionArgs.Arg7).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        value: '0',
      }),
    )
    expect(
      getAwakenerSkillById('skill.erica.parameter-fitting', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'scaling',
      values: ['1.25', '1.5', '1.75', '2', '2.25', '2.5'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(getAwakenerSkillById('skill.erica.unleash-mecha', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.erica.electromagnetic-blast', skills)?.descriptionTemplate,
    ).toContain('[Arg4]% Temporary Crit. Rate and Crit. DMG.')
    expect(
      getAwakenerSkillById('skill.erica.electromagnetic-blast', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['50', '60', '70', '80', '90', '100'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.erica.electromagnetic-blast', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['35', '42', '49', '56', '63', '70'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(
      getAwakenerSkillById('skill.erica.electromagnetic-blast', skills)?.descriptionArgs.Arg4,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '0'}))
    expect(
      getAwakenerSkillById('skill.doresain.dirge-of-the-fallen', skills)?.descriptionTemplate,
    ).toContain('This DMG enjoys [Arg2]% {STR} bonus.')
    expect(
      getAwakenerSkillById('skill.doresain.dirge-of-the-fallen', skills)?.descriptionTemplate,
    ).toContain('Gain [Power:Arg3] {STR}.')
    expect(
      getAwakenerSkillById('skill.doresain.dirge-of-the-fallen', skills)?.descriptionArgs.Arg2,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '300'}))
    expect(
      getAwakenerSkillById('skill.daffodil.sea-of-primordial-essence', skills)?.descriptionArgs
        .Arg4,
    ).toEqual({
      kind: 'fixed',
      value: '3',
    })
    expect(
      getAwakenerSkillById('skill.doll.rationality-truth-and-reality', skills)?.descriptionArgs
        .Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['32', '38.4', '44.8', '51.2', '57.6', '64'],
      suffix: '%',
      stat: 'CON',
    })
    expect(
      getAwakenerSkillById('skill.faint.boundless-starlight', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.faint.boundless-starlight', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(getAwakenerSkillById('skill.faint.cradle-of-stars', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.ogier.seven-arts-and-virtues', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['30', '36', '42', '48', '54', '60'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(
      getAwakenerSkillById('skill.karen.heres-your-meal', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['25', '30', '35', '40', '45', '50'],
      suffix: '%',
      stat: 'CON',
    })
    expect(
      getAwakenerSkillById('skill.karen.heres-your-meal', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['30', '36', '42', '48', '54', '60'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.jenkins.strike', skills)?.descriptionArgs.Arg1).toEqual({
      kind: 'scaling',
      values: ['10', '12', '14', '16', '18', '20'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'CritRate',
        multiplier: '2',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.jenkins.get-em-brown', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['15', '18', '21', '24', '27', '30'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'CritRate',
        multiplier: '2',
        mode: 'scale_base',
      },
    })
    expect(getAwakenerSkillById('skill.lily.defense', skills)?.descriptionArgs.Arg1).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['10', '12', '14', '16', '18', '20'],
        suffix: '%',
        stat: 'DEF',
      }),
    )
    expect(
      getAwakenerSkillById('skill.nautila.ready-and-set', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['25', '30', '35', '40', '45', '50'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'RealmMastery',
        multiplier: '0.25',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.ogier.seven-arts-and-virtues', skills)?.descriptionArgs.Arg2,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['15', '18', '21', '24', '27', '30'],
        suffix: '%',
        stat: 'ATK',
      }),
    )
    expect(
      getAwakenerSkillById('skill.corposant.sunken-in-the-profound', skills)?.descriptionArgs.Arg2,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['50', '60', '70', '80', '90', '100'],
        suffix: '%',
        stat: 'DEF',
      }),
    )
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.strike', skills)?.descriptionArgs.Arg5,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '0'}))
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.defense', skills)?.descriptionArgs.Arg5,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '0'}))
    expect(getAwakenerSkillById('skill.ryker.all-in', skills)?.descriptionArgs.Arg1).toEqual({
      kind: 'scaling',
      values: ['75', '90', '105', '120', '135', '150'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.entropy-undone', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'fixed',
      value: '50',
    })
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.entropy-undone', skills)?.cardKeywords,
    ).toEqual([{id: 'mechanic.retain'}])
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.sight-unbound', skills)?.cardKeywords,
    ).toEqual([])
    expect(
      getAwakenerSkillById('skill.ramona-timeworn.paradox-converged', skills)?.cardKeywords,
    ).toEqual([])
    expect(getAwakenerSkillById('skill.ryker.unexpected-gain', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.ryker.showdown', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.salvador.end-of-suffering', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['45', '54', '63', '72', '81', '90'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.salvador.end-of-suffering', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['0.75', '0.8', '0.85', '0.9', '0.95', '1'],
    })
    expect(getAwakenerSkillById('skill.salvador.end-of-suffering', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(getAwakenerSkillById('skill.sanga.the-lost-art', skills)?.descriptionArgs.Arg4).toEqual(
      expect.objectContaining({kind: 'fixed', value: '0'}),
    )
    expect(
      getAwakenerSkillById('skill.sorel.roses-infinite-desire', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['2.5', '3', '3.5', '4', '4.5', '5'],
      suffix: '%',
      stat: 'CON',
    })
    expect(getAwakenerSkillById('skill.tawil.the-silver-key-gate', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(getAwakenerSkillById('skill.tawil.omnifex-convergence', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(getAwakenerSkillById('skill.thais.ad-matrem-vocatus', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.thais.ancient-caress', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['15', '16', '17', '18', '19', '20'],
    })
    expect(
      getAwakenerSkillById('skill.thais.ancient-caress', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['3', '3.6', '4.2', '4.8', '5.4', '6'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.thais.ritual-of-abundance', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(
      getAwakenerSkillById('skill.tinct.distant-melody', skills)?.descriptionArgs.Arg4,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '45'}))
    expect(
      getAwakenerSkillById('skill.tinct.starlight-aurora', skills)?.descriptionArgs.Arg2,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '15'}))
    expect(getAwakenerSkillById('skill.tinct.starlight-aurora', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.tulu.strike', skills)?.descriptionArgs.Arg4).toEqual(
      expect.objectContaining({kind: 'fixed', value: '0'}),
    )
    expect(getAwakenerSkillById('skill.tulu.strike', skills)?.descriptionArgs.Arg2).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
    })
    expect(getAwakenerSkillById('skill.tulu.abyss-order', skills)?.descriptionArgs.Arg3).toEqual(
      expect.objectContaining({kind: 'fixed', value: '0'}),
    )
    expect(
      getAwakenerSkillById('skill.tulu.when-the-stars-are-right', skills)?.descriptionArgs.Arg3,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['15', '17', '19', '21', '23', '25'],
      }),
    )
    expect(
      getAwakenerSkillById('skill.uvhash.hymn-of-blood-and-sand', skills)?.descriptionTemplate,
    ).toContain('[Arg3]x {STR} multiplier.')
    expect(
      getAwakenerSkillById('skill.uvhash.hymn-of-blood-and-sand', skills)?.descriptionTemplate,
    ).toContain('Subsequent {Hymn of Blood and Sand} released in this battle deals +[Arg4] DMG')
    expect(
      getAwakenerSkillById('skill.uvhash.hymn-of-blood-and-sand', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(
      getAwakenerSkillById('skill.wanda.keeper-of-the-lost', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'scaling',
      values: ['40', '48', '56', '64', '72', '80'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.wanda.keeper-of-the-lost', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.wanda.spine-needle-chains', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['35', '42', '49', '56', '63', '70'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.wanda.spine-needle-chains', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'scaling',
      values: ['1.25', '1.5', '1.75', '2', '2.25', '2.5'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(getAwakenerSkillById('skill.wanda.spine-needle-chains', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(getAwakenerSkillById('skill.wanda.necropolis-of-dreams', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(
      getAwakenerSkillById('skill.wanda.necropolis-of-dreams', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['45', '54', '63', '72', '81', '90'],
      suffix: '%',
      stat: 'ATK',
      substatBonus: {
        substat: 'DamageAmplification',
        multiplier: '0.75',
        mode: 'scale_base',
      },
    })
    expect(
      getAwakenerSkillById('skill.vortice.here-it-goes', skills)?.descriptionArgs.Arg2,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['100', '110', '120', '130', '140', '150'],
      }),
    )
    expect(getAwakenerSkillById('skill.xu.lady-of-dreamless-land', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.ramona.assault-thesis', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['7.5', '9', '10.5', '12', '13.5', '15'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(
      getAwakenerSkillById('skill.faros.ocean-of-elation', skills)?.descriptionArgs.Arg4,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '50'}))
    expect(
      getAwakenerSkillById('skill.faros.ocean-of-elation', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(
      getAwakenerSkillById('skill.goliath.preemptive-revenge', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['2.5', '3', '3.5', '4', '4.5', '5'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(getAwakenerSkillById('skill.goliath.decapitation-damage', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(getAwakenerSkillById('skill.hameln.soul-overture', skills)?.cardKeywords).toEqual(
      expect.arrayContaining([{id: 'mechanic.retain'}, {id: 'mechanic.prepare', value: 1}]),
    )
    expect(getAwakenerSkillById('skill.hameln.primal-chord', skills)?.descriptionArgs.Arg2).toEqual(
      {
        kind: 'scaling',
        values: ['6', '7.2', '8.4', '9.6', '10.8', '12'],
        suffix: '%',
        stat: 'ATK',
      },
    )
    expect(getAwakenerSkillById('skill.hameln.primal-chord', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.helot.shattering-strike', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['100', '120', '140', '160', '180', '200'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.helot.lasting-loathe', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'scaling',
      values: ['25', '30', '35', '40', '45', '50'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.helot.surviving-impasse', skills)?.descriptionArgs.Arg4,
    ).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        value: '0',
        suffix: '%',
        substatBonus: {
          substat: 'DamageAmplification',
          multiplier: '0.3',
          mode: 'additive',
        },
      }),
    )
    expect(
      getAwakenerSkillById('skill.helot-catena.crimson-shackles', skills)?.cardKeywords,
    ).toEqual([{id: 'mechanic.echo'}])
    expect(getAwakenerSkillById('skill.horla.snarl-psalm', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.jenkins.spatial-fold', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(getAwakenerSkillById('skill.24.frenzied-slash', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.aigis.decomposition', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.alva.precision-slash', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.casiah.telekinesis', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.casiah.poof', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.erica.function-overload', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.tulu.immortal-majesty', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.kathigu-ra.world-ending-inferno', skills)?.descriptionArgs.Arg2,
    ).toEqual(expect.objectContaining({kind: 'fixed', value: '300'}))
    expect(
      getAwakenerSkillById('skill.liz.dance-to-destruction', skills)?.descriptionArgs.Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['20', '24', '28', '32', '36', '40'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.lotan.blade-of-defiance', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'fixed',
      value: '3',
    })
    expect(getAwakenerSkillById('skill.lotan.beast-of-chaos', skills)?.cardKeywords).toEqual([])
    expect(getAwakenerSkillById('skill.miryam.the-chosen-one', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.miryam.the-chosen-one', skills)?.descriptionTemplate,
    ).toContain('{Ritual}: Gain [Arg4]/[Arg5]/[Arg6] Aliemus.')
    expect(
      getAwakenerSkillById('skill.miryam.the-chosen-one', skills)?.descriptionArgs.Arg4,
    ).toEqual({
      kind: 'fixed',
      value: '10',
    })
    expect(
      getAwakenerSkillById('skill.miryam.the-chosen-one', skills)?.descriptionArgs.Arg5,
    ).toEqual({
      kind: 'fixed',
      value: '25',
    })
    expect(
      getAwakenerSkillById('skill.miryam.the-chosen-one', skills)?.descriptionArgs.Arg6,
    ).toEqual({
      kind: 'fixed',
      value: '50',
    })
    expect(
      getAwakenerSkillById('skill.murphy-fauxborn.princess-of-delusions', skills)?.descriptionArgs
        .Arg1,
    ).toEqual({
      kind: 'scaling',
      values: ['40', '48', '56', '64', '72', '80'],
      suffix: '%',
      stat: 'DEF',
    })
    expect(getAwakenerSkillById('skill.nautila.no-trespassing', skills)?.cardKeywords).toEqual([
      {id: 'mechanic.retain'},
    ])
    expect(
      getAwakenerSkillById('skill.pandia.honey-colored-tragedy', skills)?.descriptionArgs.Arg2,
    ).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(
      getAwakenerSkillById('skill.pandia.honey-colored-tragedy', skills)?.descriptionArgs.Arg3,
    ).toEqual({
      kind: 'scaling',
      values: ['4', '4.8', '5.6', '6.4', '7.2', '8'],
      suffix: '%',
      stat: 'ATK',
    })
    expect(
      getAwakenerSkillById('skill.pickman.morgue-studio', skills)?.descriptionArgs.Arg2,
    ).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['20', '22', '24', '26', '28', '30'],
      }),
    )
    expect(getAwakenerSkillById('skill.pickman.truth-in-delusion', skills)?.cardKeywords).toEqual(
      [],
    )
    expect(getAwakenerSkillById('skill.ramona.queens-sword', skills)?.descriptionArgs.Arg3).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        value: '5',
      }),
    )
    expect(getAwakenerSkillById('skill.ramona.queens-sword', skills)?.descriptionArgs.Arg1).toEqual(
      expect.objectContaining({
        kind: 'scaling',
        values: ['15', '18', '21', '24', '27', '30'],
        suffix: '%',
        stat: 'ATK',
      }),
    )
    expect(getAwakenerSkillById('skill.ramona.queens-sword', skills)?.descriptionArgs.Arg7).toEqual(
      expect.objectContaining({
        kind: 'fixed',
        value: '0',
      }),
    )
    expect(getAwakenerSkillById('skill.sanga.strike', skills)?.descriptionArgs.Arg2).toEqual(
      expect.objectContaining({kind: 'scaling', values: ['5', '6', '7', '8', '9', '10']}),
    )
    expect(getAwakenerSkillById('skill.sanga.defense', skills)?.descriptionArgs.Arg2).toEqual(
      expect.objectContaining({kind: 'scaling', values: ['5', '6', '7', '8', '9', '10']}),
    )
    expect(getAwakenerSkillById('skill.ramona.mundus-decree', skills)?.cardKeywords).toEqual([])
    expect(
      getAwakenerSkillById('skill.murphy.divine-maidens-birth', skills)?.descriptionTemplate,
    ).toBe(
      'Gain a total of (Max HP [Block:Arg1]% + [Block:Arg2]) Shield and [Arg3] Arithmetica. At the start of the next turn, take Max HP [Arg5]% {Sacrifice}. {Aftershock}: {Tentacle DMG} +[TentaclePower:Arg4].',
    )
  })
})
