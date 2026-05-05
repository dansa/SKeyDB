import {describe, expect, it} from 'vitest'

import {getAwakenerOverlays} from './awakener-overlays'
import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerRosterRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
  UpgradePatch,
} from './awakener-source-schema'
import {type AwakenerFullRecord} from './awakeners-full'
import {resolveAwakenerFullRecord} from './awakeners-full-resolver'
import {loadPublicAwakenerDetailById} from './public-detail-record-adapters'

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
    stats: {
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
    },
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
    descriptionTemplate: `${displayName} base`,
    descriptionArgs: {
      Arg1: {
        kind: 'fixed',
        value: '1',
      },
    },
    cardKeywords: [],
    variants: [],
  }
}

function buildDerived(id: string, displayName: string): DerivedSkillRecord {
  return {
    id,
    ownerAwakenerId: 999,
    displayName,
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

function upgradeFromPatch(
  upgraderId: string,
  upgraderType: 'enlighten' | 'talent',
  patch: UpgradePatch,
) {
  return {
    id: `upgrade.${upgraderId}.${patch.targetId}`,
    upgraderId,
    upgraderType,
    operation:
      patch.operation === 'card_keywords'
        ? 'override_card_keywords'
        : patch.operation === 'arg_substat_bonuses'
          ? 'mixed'
          : patch.operation,
    patch:
      patch.operation === 'card_keywords'
        ? {
            cardKeywords: patch.addCardKeywords,
          }
        : {
            ...(patch.descriptionTemplate ? {descriptionTemplate: patch.descriptionTemplate} : {}),
            ...(patch.descriptionArgs ? {descriptionArgs: patch.descriptionArgs} : {}),
            ...(patch.argSubstatBonuses ? {argSubstatBonuses: patch.argSubstatBonuses} : {}),
            ...(patch.addCardKeywords ? {cardKeywords: patch.addCardKeywords} : {}),
            ...(patch.removeCardKeywordIds
              ? {removeCardKeywordIds: patch.removeCardKeywordIds}
              : {}),
          },
  } as const
}

function buildRecord(): AwakenerFullRecord {
  const baseTalent = buildTalent('talent.test.base', 'Base Talent')
  const soulforgeTalent = buildTalent('talent.test.soulforge-aptitude', 'Soulforge Aptitude')
  const e1 = buildEnlighten('enlighten.test.e1', 'E1')
  const e2 = buildEnlighten('enlighten.test.e2', 'E2')
  const e3 = buildEnlighten('enlighten.test.e3', 'E3')
  const baseTalentStrikePatch: UpgradePatch = {
    targetId: 'skill.test.strike',
    targetType: 'skill',
    operation: 'arg_substat_bonuses',
    argSubstatBonuses: {
      Arg1: {
        substat: 'CritRate',
        multiplier: '1',
        suffix: '%',
      },
    },
  }
  const soulforgeDefensePatch: UpgradePatch = {
    targetId: 'skill.test.defense',
    targetType: 'skill',
    operation: 'arg_substat_bonuses',
    argSubstatBonuses: {
      Arg1: {
        substat: 'DamageAmplification',
        multiplier: '0.5',
        suffix: '%',
      },
    },
  }
  const e1StrikePatch: UpgradePatch = {
    targetId: 'skill.test.strike',
    targetType: 'skill',
    operation: 'mixed',
    descriptionTemplate: 'Strike e1',
    descriptionArgs: {
      Arg2: {
        kind: 'fixed',
        value: '2',
      },
    },
    addCardKeywords: [{id: 'mechanic.retain'}],
  }
  const e2DerivedPatch: UpgradePatch = {
    targetId: 'derived.test.extra',
    targetType: 'derived-skill',
    operation: 'override_args',
    descriptionArgs: {
      Arg1: {
        kind: 'fixed',
        value: '3',
      },
    },
  }
  const e2OverlayPatch: UpgradePatch = {
    targetId: 'overlay.test.status',
    targetType: 'overlay',
    operation: 'override_args',
    descriptionArgs: {
      StateArg1: {
        kind: 'fixed',
        value: '5',
      },
    },
  }
  const e3StrikePatch: UpgradePatch = {
    targetId: 'skill.test.strike',
    targetType: 'skill',
    operation: 'mixed',
    descriptionTemplate: 'Strike e3',
    removeCardKeywordIds: ['mechanic.retain'],
  }

  return {
    ...buildRosterRecord(),
    cards: {
      C1: {
        ...buildSkill('skill.test.strike', 'Strike', 'strike'),
        upgrades: [
          upgradeFromPatch(baseTalent.id, 'talent', baseTalentStrikePatch),
          upgradeFromPatch(e1.id, 'enlighten', e1StrikePatch),
          upgradeFromPatch(e3.id, 'enlighten', e3StrikePatch),
        ],
      },
      C2: {
        ...buildSkill('skill.test.defense', 'Defense', 'defense'),
        upgrades: [upgradeFromPatch(soulforgeTalent.id, 'talent', soulforgeDefensePatch)],
      },
      C3: buildSkill('skill.test.command-1', 'Command 1', 'command'),
      C4: buildSkill('skill.test.command-2', 'Command 2', 'command'),
      C5: buildSkill('skill.test.command-3', 'Command 3', 'command'),
      Exalt: buildSkill('skill.test.exalt', 'Exalt', 'exalt'),
      OverExalt: undefined,
      promotedExtras: [
        {
          ...buildDerived('derived.test.extra', 'Extra'),
          upgrades: [upgradeFromPatch(e2.id, 'enlighten', e2DerivedPatch)],
        },
      ],
    },
    talents: {
      T1: baseTalent,
      T2: undefined,
      T3: soulforgeTalent,
      T4: undefined,
      extraTalents: [],
    },
    enlightens: {
      E1: e1,
      E2: e2,
      E3: e3,
      AbsoluteAxiom: undefined,
    },
    derivedSkills: [buildDerived('derived.test.status-card', 'Status Card')],
    overlays: [
      {
        id: 'overlay.test.status',
        ownerAwakenerId: 999,
        displayName: 'Status',
        overlayType: 'mechanic',
        aliases: [],
        descriptionTemplate: 'Status base',
        descriptionArgs: {},
        upgrades: [upgradeFromPatch(e2.id, 'enlighten', e2OverlayPatch)],
      },
    ],
  }
}

function buildOverlayRecords(): AwakenerOverlayRecord[] {
  return [
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
      aliases: [],
      descriptionTemplate: 'Status base',
      descriptionArgs: {},
    },
  ]
}

describe('awakeners-full-resolver', () => {
  it('treats selected enlighten slot as cumulative through that slot', () => {
    const resolved = resolveAwakenerFullRecord(
      buildRecord(),
      {
        selectedEnlightenSlot: 'E2',
      },
      buildOverlayRecords(),
    )

    expect(resolved.activeEnlightenIds).toEqual(['enlighten.test.e1', 'enlighten.test.e2'])
  })

  it('applies base talent patches and gates soulforge talent patches by soulforge level', () => {
    const disabledSoulforge = resolveAwakenerFullRecord(buildRecord(), {
      soulforgeLevel: 0,
    })
    const enabledSoulforge = resolveAwakenerFullRecord(buildRecord(), {
      soulforgeLevel: 2,
    })

    expect(disabledSoulforge.record.cards.C1.descriptionArgs.Arg1).toEqual({
      kind: 'fixed',
      value: '1',
      substatBonus: {
        substat: 'CritRate',
        multiplier: '1',
        suffix: '%',
      },
    })
    expect(disabledSoulforge.record.cards.C2.descriptionArgs.Arg1).toEqual({
      kind: 'fixed',
      value: '1',
    })
    expect(enabledSoulforge.record.cards.C2.descriptionArgs.Arg1).toEqual({
      kind: 'fixed',
      value: '1',
      substatBonus: {
        substat: 'DamageAmplification',
        multiplier: '0.5',
        suffix: '%',
      },
    })
  })

  it('applies cumulative enlighten patches to skills, derived skills, and overlay overrides', () => {
    const resolved = resolveAwakenerFullRecord(
      buildRecord(),
      {
        selectedEnlightenSlot: 'E3',
      },
      buildOverlayRecords(),
    )

    expect(resolved.activeEnlightenIds).toEqual([
      'enlighten.test.e1',
      'enlighten.test.e2',
      'enlighten.test.e3',
    ])
    expect(resolved.record.cards.C1.descriptionTemplate).toBe('Strike e3')
    expect(resolved.record.cards.C1.descriptionArgs).toEqual({
      Arg1: {
        kind: 'fixed',
        value: '1',
        substatBonus: {
          substat: 'CritRate',
          multiplier: '1',
          suffix: '%',
        },
      },
      Arg2: {
        kind: 'fixed',
        value: '2',
      },
    })
    expect(resolved.record.cards.C1.cardKeywords).toEqual([])
    expect(resolved.record.cards.promotedExtras[0]?.descriptionArgs).toEqual({
      Arg1: {
        kind: 'fixed',
        value: '3',
      },
    })
    expect(resolved.overlayOverridesById).toEqual({
      'overlay.test.status': expect.objectContaining({
        id: 'overlay.test.status',
        descriptionArgs: {
          StateArg1: {
            kind: 'fixed',
            value: '5',
          },
        },
      }),
    })
  })

  it('keeps soulforge aptitude visible even when its effects are disabled', () => {
    const resolved = resolveAwakenerFullRecord(buildRecord(), {
      soulforgeLevel: 0,
    })

    expect(resolved.record.talents.T3?.id).toBe('talent.test.soulforge-aptitude')
  })

  it('applies real cumulative skill patches from public V2 enlightens', async () => {
    const thais = await loadPublicAwakenerDetailById(48)
    expect(thais).toBeDefined()
    if (!thais) {
      throw new Error('Missing canonical Thais V2 record')
    }

    const resolved = resolveAwakenerFullRecord(thais, {
      selectedEnlightenSlot: 'E3',
    })

    const strike = [
      resolved.record.cards.C1,
      resolved.record.cards.C2,
      resolved.record.cards.C3,
      resolved.record.cards.C4,
      resolved.record.cards.C5,
      resolved.record.cards.Exalt,
      ...(resolved.record.cards.OverExalt ? [resolved.record.cards.OverExalt] : []),
    ].find((card) => card.id === 'skill.thais.strike')
    const defense = [
      resolved.record.cards.C1,
      resolved.record.cards.C2,
      resolved.record.cards.C3,
      resolved.record.cards.C4,
      resolved.record.cards.C5,
      resolved.record.cards.Exalt,
      ...(resolved.record.cards.OverExalt ? [resolved.record.cards.OverExalt] : []),
    ].find((card) => card.id === 'skill.thais.defense')

    expect(resolved.activeEnlightenIds).toEqual([
      'enlighten.thais.forests-embrace',
      'enlighten.thais.seed-of-chaos',
      'enlighten.thais.everlasting-cycle',
    ])
    expect(strike?.descriptionTemplate).toBe(
      'Deal [Damage:Arg1] DMG. Thais obtains [Energy:Arg2] Aliemus. Obtain [Power:Arg3] {STR}.',
    )
    expect(defense?.descriptionTemplate).toBe(
      'Gain [Block:Arg1] Shield. Thais obtains [Energy:Arg2] Aliemus. Obtain [Power:Arg3] {STR}.',
    )
    expect(strike?.descriptionArgs.Arg3).toEqual({
      kind: 'fixed',
      value: '1',
      suffix: '%',
      stat: 'ATK',
    })
  })

  it('applies real overlay patches from public V2 enlightens without embedding shared overlays', async () => {
    const wanda = await loadPublicAwakenerDetailById(52)
    expect(wanda).toBeDefined()
    if (!wanda) {
      throw new Error('Missing canonical Wanda V2 record')
    }

    const resolved = resolveAwakenerFullRecord(
      wanda,
      {
        selectedEnlightenSlot: 'E2',
      },
      getAwakenerOverlays(),
    )

    expect(Object.keys(resolved.overlayOverridesById)).toEqual(['overlay.wanda.murmurs'])
    expect(resolved.overlayOverridesById['overlay.wanda.murmurs'].descriptionArgs).toEqual(
      expect.objectContaining({
        StateArg1: {
          kind: 'fixed',
          value: '65',
        },
      }),
    )
  })

  it('applies public V2 Xu overlay upgrades through the resolver override surface', async () => {
    const xu = await loadPublicAwakenerDetailById('awakener-0054')
    expect(xu).toBeDefined()
    if (!xu) {
      throw new Error('Missing public V2 Xu record')
    }

    const resolved = resolveAwakenerFullRecord(
      xu,
      {
        selectedEnlightenSlot: 'E3',
      },
      getAwakenerOverlays(),
    )

    expect(resolved.overlayOverridesById['overlay.xu.spellbound'].descriptionArgs.DescArg2).toEqual(
      {
        kind: 'fixed',
        value: '10',
      },
    )
  })

  it('applies Sanga talent substat patches to strike and defense Aliemus args', async () => {
    const sanga = await loadPublicAwakenerDetailById('awakener-0045')
    expect(sanga).toBeDefined()
    if (!sanga) {
      throw new Error('Missing public V2 Sanga record')
    }

    const resolved = resolveAwakenerFullRecord(sanga)

    expect(resolved.record.cards.C2.descriptionArgs.Arg2).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
      substatBonus: {
        substat: 'DeathResistance',
        multiplier: '0.03',
        mode: 'additive',
      },
    })
    expect(resolved.record.cards.C3.descriptionArgs.Arg2).toEqual({
      kind: 'scaling',
      values: ['5', '6', '7', '8', '9', '10'],
      substatBonus: {
        substat: 'DeathResistance',
        multiplier: '0.03',
        mode: 'additive',
      },
    })
  })
})
