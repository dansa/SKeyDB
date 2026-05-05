import {describe, expect, it} from 'vitest'

import type {AwakenerFullRecord} from './awakeners-full'
import {
  DEFAULT_DATABASE_DETAIL_PREFERENCES,
  normalizeDatabaseDetailPreferences,
  readDatabaseDetailPreferences,
  resolveDatabaseDetailDefaultSelection,
  writeDatabaseDetailPreferences,
} from './database-detail-preferences'

function createStorage(initial: Record<string, string> = {}) {
  const state = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return state.get(key) ?? null
    },
    setItem(key: string, value: string) {
      state.set(key, value)
    },
    removeItem(key: string) {
      state.delete(key)
    },
  }
}

describe('database-detail-preferences', () => {
  it('normalizes persisted preferences and falls back on invalid values', () => {
    expect(
      normalizeDatabaseDetailPreferences({
        shared: {
          showTagIcons: false,
          clickOutsideClosesPopovers: false,
          fontScale: 'large',
          accountLevel: 999,
        },
        awakener: {
          showVisibleScaling: false,
          defaultSelection: {
            awakenerLevel: 999,
            psycheSurgeOffset: -5,
            skillLevel: 9,
            selectedEnlightenSlot: 'AbsoluteAxiom',
            soulforgeLevel: -2,
          },
        },
        wheel: {
          defaultEnhanceLevel: 999,
          expandLoreByDefault: true,
        },
      }),
    ).toEqual({
      shared: {
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'large',
        accountLevel: 100,
      },
      awakener: {
        showVisibleScaling: false,
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 0,
          skillLevel: 6,
          selectedEnlightenSlot: 'AbsoluteAxiom',
          soulforgeLevel: 0,
        },
      },
      wheel: {
        defaultEnhanceLevel: 15,
        expandLoreByDefault: true,
      },
    })
  })

  it('reads stored preferences safely and ignores invalid payloads', () => {
    const validStorage = createStorage({
      'database-detail-preferences': JSON.stringify({
        shared: {
          showTagIcons: false,
          clickOutsideClosesPopovers: false,
          fontScale: 'medium',
          accountLevel: 77,
        },
        awakener: {
          showVisibleScaling: false,
          defaultSelection: {
            awakenerLevel: 90,
            psycheSurgeOffset: 2,
            skillLevel: 4,
            selectedEnlightenSlot: 'E2',
            soulforgeLevel: 3,
          },
        },
        wheel: {
          defaultEnhanceLevel: 7,
          expandLoreByDefault: true,
        },
      }),
    })

    expect(readDatabaseDetailPreferences(validStorage)).toEqual({
      shared: {
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'medium',
        accountLevel: 77,
      },
      awakener: {
        showVisibleScaling: false,
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 2,
          skillLevel: 4,
          selectedEnlightenSlot: 'E2',
          soulforgeLevel: 3,
        },
      },
      wheel: {
        defaultEnhanceLevel: 7,
        expandLoreByDefault: true,
      },
    })

    const invalidStorage = createStorage({
      'database-detail-preferences': '{not json',
    })

    expect(readDatabaseDetailPreferences(invalidStorage)).toEqual(
      DEFAULT_DATABASE_DETAIL_PREFERENCES,
    )
  })

  it('writes normalized preferences for later sessions', () => {
    const storage = createStorage()

    expect(
      writeDatabaseDetailPreferences(
        {
          shared: {
            clickOutsideClosesPopovers: false,
            fontScale: 'medium',
            accountLevel: 42,
          },
          awakener: {
            showVisibleScaling: false,
            defaultSelection: {
              awakenerLevel: 70,
              psycheSurgeOffset: 1,
              skillLevel: 3,
              selectedEnlightenSlot: 'E1',
              soulforgeLevel: 2,
            },
          },
          wheel: {
            defaultEnhanceLevel: 11,
            expandLoreByDefault: true,
          },
        },
        storage,
      ),
    ).toBe(true)

    expect(JSON.parse(storage.getItem('database-detail-preferences') ?? 'null')).toEqual({
      shared: {
        showTagIcons: true,
        clickOutsideClosesPopovers: false,
        fontScale: 'medium',
        accountLevel: 42,
      },
      awakener: {
        showVisibleScaling: false,
        defaultSelection: {
          awakenerLevel: 70,
          psycheSurgeOffset: 1,
          skillLevel: 3,
          selectedEnlightenSlot: 'E1',
          soulforgeLevel: 2,
        },
      },
      wheel: {
        defaultEnhanceLevel: 11,
        expandLoreByDefault: true,
      },
    })
  })

  it('upgrades legacy flat preferences into the modal-scoped shape', () => {
    const legacyStorage = createStorage({
      'database-detail-preferences': JSON.stringify({
        showVisibleScaling: false,
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'medium',
        accountLevel: 22,
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 2,
          skillLevel: 4,
          selectedEnlightenSlot: 'E2',
          soulforgeLevel: 3,
        },
        defaultWheelEnhanceLevel: 5,
        expandWheelLoreByDefault: true,
      }),
    })

    expect(readDatabaseDetailPreferences(legacyStorage)).toEqual({
      shared: {
        showTagIcons: false,
        clickOutsideClosesPopovers: false,
        fontScale: 'medium',
        accountLevel: 22,
      },
      awakener: {
        showVisibleScaling: false,
        defaultSelection: {
          awakenerLevel: 90,
          psycheSurgeOffset: 2,
          skillLevel: 4,
          selectedEnlightenSlot: 'E2',
          soulforgeLevel: 3,
        },
      },
      wheel: {
        defaultEnhanceLevel: 5,
        expandLoreByDefault: true,
      },
    })
  })

  it('resolves persisted defaults against an awakener contract', () => {
    const record = buildRecord()

    expect(
      resolveDatabaseDetailDefaultSelection(record, {
        ...DEFAULT_DATABASE_DETAIL_PREFERENCES,
        awakener: {
          ...DEFAULT_DATABASE_DETAIL_PREFERENCES.awakener,
          defaultSelection: {
            awakenerLevel: 90,
            psycheSurgeOffset: 4,
            skillLevel: 5,
            selectedEnlightenSlot: 'AbsoluteAxiom',
            soulforgeLevel: 8,
          },
        },
      }),
    ).toEqual({
      awakenerLevel: 90,
      psycheSurgeOffset: 4,
      skillLevel: 5,
      selectedEnlightenSlot: 'E3',
      soulforgeLevel: 3,
    })
  })
})

function buildRecord(): AwakenerFullRecord {
  return {
    id: 1,
    key: 'test',
    displayName: 'Test',
    aliases: ['test'],
    faction: 'Test',
    realm: 'CHAOS',
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
    statScaling: {CON: 1, ATK: 1, DEF: 1},
    substatScaling: {},
    assets: {portraitKey: 'test', iconKey: 'test'},
    searchTags: [],
    cards: {
      C1: {
        id: 'skill.test.c1',
        ownerAwakenerId: 1,
        kind: 'rouse',
        displayName: 'Rouse',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C2: {
        id: 'skill.test.c2',
        ownerAwakenerId: 1,
        kind: 'strike',
        displayName: 'Strike',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C3: {
        id: 'skill.test.c3',
        ownerAwakenerId: 1,
        kind: 'defense',
        displayName: 'Defense',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      C4: {
        id: 'skill.test.c4',
        ownerAwakenerId: 1,
        kind: 'command',
        displayName: 'C4',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
        cost: '1',
      },
      C5: {
        id: 'skill.test.c5',
        ownerAwakenerId: 1,
        kind: 'command',
        displayName: 'C5',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
        cost: '1',
      },
      Exalt: {
        id: 'skill.test.exalt',
        ownerAwakenerId: 1,
        kind: 'exalt',
        displayName: 'Exalt',
        descriptionTemplate: '',
        descriptionArgs: {},
        cardKeywords: [],
        variants: [],
      },
      promotedExtras: [],
    },
    talents: {
      T1: undefined,
      T2: undefined,
      T3: {
        id: 'talent.test.soulforge-aptitude',
        ownerAwakenerId: 1,
        displayName: 'Soulforge Aptitude',
        descriptionTemplate: '',
        descriptionArgs: {},
        hasLevelScaledDescription: true,
        maxLevel: 3,
      },
      T4: undefined,
      extraTalents: [],
    },
    enlightens: {
      E1: {
        id: 'enlighten.test.e1',
        ownerAwakenerId: 1,
        slot: 'E1',
        displayName: 'E1',
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      E2: {
        id: 'enlighten.test.e2',
        ownerAwakenerId: 1,
        slot: 'E2',
        displayName: 'E2',
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      E3: {
        id: 'enlighten.test.e3',
        ownerAwakenerId: 1,
        slot: 'E3',
        displayName: 'E3',
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      AbsoluteAxiom: undefined,
    },
    derivedSkills: [],
  }
}
