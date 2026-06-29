import {describe, expect, it} from 'vitest'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerRosterRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
  FullStats,
} from './awakener-source-schema'
import {
  resolveAwakenerDatabaseOverlay,
  resolveAwakenerDatabaseReferenceInfo,
  resolveAwakenerDatabaseReferenceInfoById,
} from './awakeners-database-reference-info'
import {
  resolveAwakenerDatabaseShellView,
  resolveAwakenerDatabaseView,
} from './awakeners-database-view'
import type {AwakenerFullRecord} from './awakeners-full'
import type {PublicDescriptionArg} from './public-description-args'

const TEST_STATS: FullStats = {
  CON: '100',
  ATK: '100',
  DEF: '100',
  CritRate: '5%',
  CritDamage: '50%',
  AliemusRegen: '0',
  KeyflareRegen: '15',
  RealmMastery: '0',
  SigilYield: '0%',
  DamageAmplification: '0%',
  DeathResistance: '0%',
}

function buildRosterRecord(): AwakenerRosterRecord {
  return {
    id: 999,
    key: 'tester',
    displayName: 'Tester',
    aliases: ['tester'],
    faction: 'Test',
    realm: 'ULTRA',
    rarity: 'SSR',
    type: 'ASSAULT',
    stats: TEST_STATS,
    primaryScalingBase: 20,
    statScaling: {
      CON: 1,
      ATK: 1,
      DEF: 1,
    },
    substatScaling: {},
    assets: {
      portraitKey: 'tester',
      iconKey: 'tester',
    },
    searchTags: ['Draw'],
  }
}

function buildSkill(
  id: string,
  displayName: string,
  kind: AwakenerSkillRecord['kind'],
): AwakenerSkillRecord {
  return {
    id,
    ownerAwakenerId: 999,
    kind,
    displayName,
    descriptionTemplate: `${displayName} uses {Status}.`,
    descriptionArgs: {
      Arg1: {
        kind: 'fixed',
        value: '1',
      },
    },
    cardKeywords: [{id: 'mechanic.retain'}],
    variants: [],
  }
}

function buildDerived(id: string, displayName: string): DerivedSkillRecord {
  return {
    id,
    ownerAwakenerId: 999,
    displayName,
    aliases: [],
    descriptionTemplate: `${displayName} base`,
    descriptionArgs: {
      Arg1: {
        kind: 'fixed',
        value: '1',
      },
    },
    childDerivedSkillIds: [],
    cardKeywords: [],
    variants: [],
  }
}

function buildTalent(id: string, displayName: string): AwakenerTalentRecord {
  return {
    id,
    ownerAwakenerId: 999,
    displayName,
    descriptionTemplate: `${displayName} description`,
    descriptionArgs: {},
  }
}

function buildEnlighten(
  id: string,
  slot: AwakenerEnlightenRecord['slot'],
): AwakenerEnlightenRecord {
  return {
    id,
    ownerAwakenerId: 999,
    slot,
    displayName: id,
    descriptionTemplate: `${id} description`,
    descriptionArgs: {},
  }
}

function buildRecord(): AwakenerFullRecord {
  const baseTalent = buildTalent('talent.test.base', 'Base Talent')
  const e1 = buildEnlighten('enlighten.test.e1', 'E1')
  const e2 = buildEnlighten('enlighten.test.e2', 'E2')
  return {
    ...buildRosterRecord(),
    cards: {
      C1: {
        ...buildSkill('skill.test.rouse', 'Strike', 'strike'),
        upgrades: [
          {
            id: 'upgrade.talent.test.base.skill.test.rouse',
            upgraderId: baseTalent.id,
            upgraderType: 'talent',
            operation: 'mixed',
            patch: {
              argSubstatBonuses: {
                Arg1: {
                  substat: 'CritRate',
                  multiplier: '1',
                  suffix: '%',
                },
              },
            },
          },
          {
            id: 'upgrade.enlighten.test.e1.skill.test.rouse',
            upgraderId: e1.id,
            upgraderType: 'enlighten',
            upgraderSlot: 'E1',
            operation: 'mixed',
            patch: {
              descriptionTemplate: 'Strike E1 with {Status}.',
              descriptionArgs: {
                Arg2: {
                  kind: 'fixed',
                  value: '2',
                },
              },
              cardKeywords: [
                {
                  id: 'mechanic.prepare',
                  value: 2,
                },
              ],
            },
          },
        ],
      },
      C2: buildSkill('skill.test.defense', 'Defense', 'defense'),
      C3: buildSkill('skill.test.command-1', 'Command 1', 'command'),
      C4: {
        ...buildSkill('skill.test.command-2', 'Command 2', 'command'),
        upgrades: [
          {
            id: 'upgrade.enlighten.test.e1.skill.test.command-2',
            upgraderId: e1.id,
            upgraderType: 'enlighten',
            upgraderSlot: 'E1',
            operation: 'link_only',
            patch: {},
          },
        ],
      },
      C5: buildSkill('skill.test.command-3', 'Command 3', 'command'),
      Exalt: buildSkill('skill.test.exalt', 'Exalt', 'exalt'),
      OverExalt: undefined,
      promotedExtras: [buildDerived('derived.test.extra', 'Extra')],
    },
    talents: {
      T1: baseTalent,
      T2: undefined,
      T3: undefined,
      T4: undefined,
      extraTalents: [
        {
          id: 'talent.test.soulforge-aptitude',
          ownerAwakenerId: 999,
          displayName: 'Soulforge Aptitude',
          descriptionTemplate: 'Soulforge [Arg1].',
          descriptionArgs: {
            Arg1: {
              kind: 'scaling',
              values: ['10', '20', '30'],
            },
          },
          maxLevel: 3,
        },
      ],
    },
    enlightens: {
      E1: e1,
      E2: e2,
      E3: buildEnlighten('enlighten.test.e3', 'E3'),
      AbsoluteAxiom: undefined,
    },
    derivedSkills: [
      {
        ...buildDerived('derived.test.status-card', 'Status Card'),
        nodeKind: 'group',
        childDerivedSkillIds: ['derived.test.status-card-child'],
      },
      {
        ...buildDerived('derived.test.status-card-child', 'Status Child'),
        aliases: ['Status Alias Card'],
        upgrades: [
          {
            id: 'upgrade.enlighten.test.e2.derived.test.status-card-child',
            upgraderId: e2.id,
            upgraderType: 'enlighten',
            upgraderSlot: 'E2',
            operation: 'replace_description',
            patch: {
              descriptionTemplate: 'Status Child E2.',
            },
          },
        ],
      },
    ],
    overlays: [
      {
        id: 'overlay.test.status',
        ownerAwakenerId: 999,
        displayName: 'Status',
        overlayType: 'mechanic',
        aliases: ['Status Alias'],
        descriptionTemplate: 'Status base',
        descriptionArgs: {},
        upgrades: [
          {
            id: 'upgrade.enlighten.test.e2.overlay.test.status',
            upgraderId: e2.id,
            upgraderType: 'enlighten',
            upgraderSlot: 'E2',
            operation: 'mixed',
            patch: {
              descriptionTemplate: 'Status E2 [StateArg1].',
              descriptionArgs: {
                StateArg1: {
                  kind: 'fixed',
                  value: '5',
                },
              },
            },
          },
        ],
      },
    ],
  } as unknown as AwakenerFullRecord
}

function buildOverlayRecords(): AwakenerOverlayRecord[] {
  return [
    {
      id: 'overlay.global.rouse',
      displayName: 'Rouse',
      overlayType: 'mechanic',
      aliases: [],
      descriptionTemplate: 'Rouse overlay',
      descriptionArgs: {},
    },
    {
      id: 'overlay.global.over-exalt',
      displayName: 'Over-Exalt',
      overlayType: 'mechanic',
      aliases: ['Over Exalt'],
      descriptionTemplate: 'Over-Exalt base',
      descriptionArgs: {},
    },
    {
      id: 'overlay.global.counter',
      displayName: 'Counter',
      overlayType: 'mechanic',
      aliases: [],
      descriptionTemplate: 'Counter base',
      descriptionArgs: {},
    },
    {
      id: 'overlay.test.status',
      ownerAwakenerId: 999,
      displayName: 'Status',
      overlayType: 'mechanic',
      aliases: ['Status Alias'],
      descriptionTemplate: 'Status base',
      descriptionArgs: {},
    },
  ]
}

function buildGlobalDerivedSkills(): DerivedSkillRecord[] {
  return [
    {
      id: 'derived.global.embryo',
      displayName: 'Embryo',
      aliases: ['Embryonic Alias'],
      descriptionTemplate: 'Embryo base',
      descriptionArgs: {
        Arg1: {
          kind: 'fixed',
          value: '30',
        },
      },
      childDerivedSkillIds: [],
      cardKeywords: [],
      variants: [],
    },
  ]
}

describe('awakeners-database-view', () => {
  it('builds shell section data without carrying reference lookups', () => {
    const shellView = resolveAwakenerDatabaseShellView(
      buildRecord(),
      {
        skillLevel: 3,
        selectedEnlightenSlot: 'E2',
        soulforgeLevel: 0,
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
    )

    expect(shellView.activeEnlightenIds).toEqual(['enlighten.test.e1', 'enlighten.test.e2'])
    expect(shellView.commandCards[0]?.resolved.description).toBe('Strike E1 with {Status}.')
    expect(shellView.commandCards[0]?.influencingEnlightenSlots).toEqual(['E1'])
    expect(shellView.commandCards[3]?.influencingEnlightenSlots).toEqual(['E1'])
    expect(shellView.commandCards[0]?.influencingTalentIds).toEqual(['talent.test.base'])
    expect(
      (shellView.commandCards[0] as unknown as {influenceBadges?: unknown[]}).influenceBadges,
    ).toEqual([
      {
        kind: 'enlighten',
        id: 'enlighten.test.e1',
        label: 'E1',
        referenceName: 'enlighten.test.e1',
        slot: 'E1',
      },
      {
        kind: 'talent',
        id: 'talent.test.base',
        label: 'Talent',
        referenceName: 'Base Talent',
      },
    ])
    expect(shellView.commandCards[0]?.keywordFooterText).toBe('{Retain}, {Prepare 2}')
    expect(shellView.talents.map((entry) => entry.record.id)).toEqual([
      'talent.test.base',
      'talent.test.soulforge-aptitude',
    ])
    expect(shellView.talents[1]?.resolved.description).toBe('Soulforge 10.')
    expect('cardNames' in shellView).toBe(false)
    expect('referenceInfoByName' in shellView).toBe(false)
    expect('referenceInfoById' in shellView).toBe(false)
    expect('overlayByName' in shellView).toBe(false)
  })

  it('builds a cumulative resolved view with described sections and card-name lookup', () => {
    const view = resolveAwakenerDatabaseView(
      buildRecord(),
      {
        skillLevel: 3,
        selectedEnlightenSlot: 'E2',
        soulforgeLevel: 0,
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    expect(view.activeEnlightenIds).toEqual(['enlighten.test.e1', 'enlighten.test.e2'])
    expect(view.commandCards[0]?.resolved.description).toBe('Strike E1 with {Status}.')
    expect(view.commandCards[0]?.influencingEnlightenSlots).toEqual(['E1'])
    expect(view.commandCards[3]?.influencingEnlightenSlots).toEqual(['E1'])
    expect(view.commandCards[0]?.influencingTalentIds).toEqual(['talent.test.base'])
    expect(
      (view.commandCards[0] as unknown as {influenceBadges?: unknown[]}).influenceBadges,
    ).toEqual([
      {
        kind: 'enlighten',
        id: 'enlighten.test.e1',
        label: 'E1',
        referenceName: 'enlighten.test.e1',
        slot: 'E1',
      },
      {
        kind: 'talent',
        id: 'talent.test.base',
        label: 'Talent',
        referenceName: 'Base Talent',
      },
    ])
    expect(
      resolveAwakenerDatabaseReferenceInfo(view, 'Strike') as unknown as {
        influenceBadges?: unknown[]
      },
    ).toMatchObject({
      influenceBadges: [
        {
          kind: 'enlighten',
          id: 'enlighten.test.e1',
          label: 'E1',
          referenceName: 'enlighten.test.e1',
          slot: 'E1',
        },
        {
          kind: 'talent',
          id: 'talent.test.base',
          label: 'Talent',
          referenceName: 'Base Talent',
        },
      ],
    })
    expect(view.commandCards[0]?.keywordFooterText).toBe('{Retain}, {Prepare 2}')
    expect(view.talents.map((entry) => entry.record.id)).toEqual([
      'talent.test.base',
      'talent.test.soulforge-aptitude',
    ])
    expect(view.talents[1]?.resolved.description).toBe('Soulforge 10.')
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Status Child')?.description).toBe(
      'Status Child E2.',
    )
    expect(view.cardNames.has('Rouse')).toBe(false)
    expect(view.cardNames.has('Embryo')).toBe(true)
  })

  it('uses the selected soulforge level when resolving soulforge aptitude descriptions', () => {
    const view = resolveAwakenerDatabaseView(
      buildRecord(),
      {
        soulforgeLevel: 2,
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    const soulforge = view.talents.find(
      (entry) => entry.record.id === 'talent.test.soulforge-aptitude',
    )
    expect(soulforge?.resolved.description).toBe('Soulforge 20.')
  })

  it('preserves explicit talent ordering instead of regrouping standard slots before extras', () => {
    const record = buildRecord()
    const festering = buildTalent('talent.test.festering-grace', 'Festering Grace')
    const madness = buildTalent('talent.test.madness-omen', 'Madness Omen')
    madness.family = 'madness_omen'
    const soulforge = record.talents.extraTalents[0]
    soulforge.family = 'soulforge_aptitude'
    const gnostic = buildTalent('talent.test.gnostic-potential', 'Gnostic Potential')
    gnostic.family = 'gnostic_potential'

    record.talents.T2 = madness
    record.talents.T3 = soulforge
    record.talents.T4 = gnostic
    record.talents.extraTalents = [festering]
    record.talents.orderedTalents = [
      record.talents.T1,
      festering,
      madness,
      soulforge,
      gnostic,
    ].filter((talent): talent is AwakenerTalentRecord => Boolean(talent))

    const view = resolveAwakenerDatabaseView(
      record,
      {
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    expect(view.talents.map((entry) => entry.record.id)).toEqual([
      'talent.test.base',
      'talent.test.festering-grace',
      'talent.test.madness-omen',
      'talent.test.soulforge-aptitude',
      'talent.test.gnostic-potential',
    ])
    expect(view.talents.map((entry) => entry.key)).toEqual([
      'talent:talent.test.base',
      'talent:talent.test.festering-grace',
      'talent:talent.test.madness-omen',
      'talent:talent.test.soulforge-aptitude',
      'talent:talent.test.gnostic-potential',
    ])
  })

  it('uses the selected Gnostic Potential level instead of maxing generic scaled talents', () => {
    const record = buildRecord()
    record.talents.T4 = {
      id: 'talent.test.gnostic-potential',
      ownerAwakenerId: 999,
      displayName: 'Gnostic Potential',
      descriptionTemplate: 'Gnostic [Arg1].',
      descriptionArgs: {
        Arg1: {
          kind: 'linear',
          base: '2',
          gainPerLevel: '2',
        },
      },
      family: 'gnostic_potential',
      hasLevelScaledDescription: true,
      maxLevel: 5,
    }

    const defaultView = resolveAwakenerDatabaseView(
      record,
      {
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )
    const maxedView = resolveAwakenerDatabaseView(
      record,
      {
        gnosticPotentialLevel: 5,
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    const defaultGnostic = defaultView.talents.find(
      (entry) => entry.record.id === 'talent.test.gnostic-potential',
    )
    const maxedGnostic = maxedView.talents.find(
      (entry) => entry.record.id === 'talent.test.gnostic-potential',
    )

    expect(defaultGnostic?.resolved.description).toBe('Gnostic 0.')
    expect(defaultGnostic?.descriptionRank).toBe(0)
    expect(maxedGnostic?.resolved.description).toBe('Gnostic 10.')
    expect(maxedGnostic?.descriptionRank).toBe(5)
  })

  it('uses formula context when resolving shell and reference descriptions', () => {
    const record = buildRecord()
    record.cards.C4 = {
      ...record.cards.C4,
      descriptionTemplate: 'Computed [Arg1].',
      descriptionArgs: {
        Arg1: {
          kind: 'computed',
          formulaKey: 'wheelRefinementLinear',
          baseValue: 0,
          perLevel: 3,
          inputs: ['wheelRefinementLevel'],
        } satisfies PublicDescriptionArg,
      },
    }

    const view = resolveAwakenerDatabaseView(
      record,
      {
        formulaContext: {wheelRefinementLevel: 4},
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    const command = view.commandCards.find((entry) => entry.record.id === 'skill.test.command-2')
    expect(command?.resolved.description).toBe('Computed 12.')
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Command 2')).toEqual(
      expect.objectContaining({
        description: 'Computed 12.',
      }),
    )
  })

  it('preserves optional section ordering and labels for exalts, enlightens, and derived entries', () => {
    const record = buildRecord()
    record.cards.OverExalt = buildSkill('skill.test.over-exalt', 'Over Exalt', 'exalt')
    record.enlightens.AbsoluteAxiom = buildEnlighten(
      'enlighten.test.absolute-axiom',
      'AbsoluteAxiom',
    )

    const view = resolveAwakenerDatabaseView(
      record,
      {
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    expect(view.commandCards.map((entry) => entry.key)).toEqual(['C1', 'C2', 'C3', 'C4', 'C5'])
    expect(view.exalts.map((entry) => ({key: entry.key, label: entry.label}))).toEqual([
      {key: 'Exalt', label: 'Card · Exalt · Cost —'},
      {key: 'OverExalt', label: 'Card · Over Exalt · Cost —'},
    ])
    expect(view.overExalt?.key).toBe('OverExalt')
    expect(view.enlightens.map((entry) => ({key: entry.key, label: entry.label}))).toEqual([
      {key: 'E1', label: 'Enlighten · E1'},
      {key: 'E2', label: 'Enlighten · E2'},
      {key: 'E3', label: 'Enlighten · E3'},
      {key: 'AbsoluteAxiom', label: 'Absolute Axiom'},
    ])
    expect(view.promotedExtras.map((entry) => entry.key)).toEqual(['promoted:derived.test.extra'])
    expect(view.derivedSkills.map((entry) => entry.key)).toEqual([
      'derived:derived.test.status-card',
      'derived:derived.test.status-card-child',
    ])
  })

  it('resolves reference lookups for rouse aliases, overlays, and global derived cards', () => {
    const view = resolveAwakenerDatabaseView(
      buildRecord(),
      {
        selectedEnlightenSlot: 'E2',
        stats: TEST_STATS,
      },
      buildOverlayRecords(),
      buildGlobalDerivedSkills(),
    )

    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Rouse')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.global.rouse',
        label: 'Mechanic',
        description: 'Rouse overlay',
      }),
    )
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Embryo')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.embryo',
      }),
    )
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Embryonic Alias')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.global.embryo',
        name: 'Embryo',
      }),
    )
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Status Alias Card')).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.test.status-card-child',
        name: 'Status Child',
      }),
    )
    expect(view.cardNames.has('Status Alias Card')).toBe(true)
    expect(view.cardNames.has('Embryonic Alias')).toBe(true)
    expect(
      resolveAwakenerDatabaseReferenceInfoById(view, 'derived.test.status-card-child'),
    ).toEqual(
      expect.objectContaining({
        kind: 'derived-skill',
        id: 'derived.test.status-card-child',
        name: 'Status Child',
      }),
    )
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Status Alias')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.test.status',
        label: 'Mechanic',
        description: 'Status E2 5.',
      }),
    )
    expect(resolveAwakenerDatabaseReferenceInfo(view, 'Over Exalt')).toEqual(
      expect.objectContaining({
        kind: 'overlay',
        id: 'overlay.global.over-exalt',
        name: 'Over-Exalt',
        label: 'Mechanic',
      }),
    )
    expect(resolveAwakenerDatabaseOverlay(view, 'Status Alias')).toEqual(
      expect.objectContaining({
        id: 'overlay.test.status',
        descriptionTemplate: 'Status E2 [StateArg1].',
      }),
    )
    expect(resolveAwakenerDatabaseOverlay(view, 'Over Exalt')).toEqual(
      expect.objectContaining({
        id: 'overlay.global.over-exalt',
        displayName: 'Over-Exalt',
      }),
    )
  })
})
