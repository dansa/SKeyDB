import {afterEach, beforeEach, vi} from 'vitest'

import {BUILDER_PERSISTENCE_KEY} from './builder-persistence'

vi.mock('../../domain/awakeners', () => ({
  getAwakeners: () => [
    {
      id: 'awakener-0021',
      numericId: 21,
      name: 'goliath',
      faction: 'Among the Stars',
      realm: 'CHAOS',
      aliases: ['goliath'],
      tags: [],
      lineupToken: 'f',
    },
    {
      id: 'awakener-0042',
      numericId: 42,
      name: 'ramona',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['ramona'],
      tags: [],
      lineupToken: 'N',
    },
    {
      id: 'awakener-0020',
      numericId: 20,
      name: 'ramona: timeworn',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['timeworn ramona'],
      tags: [],
      lineupToken: 'j',
    },
    {
      id: 'awakener-0002',
      numericId: 2,
      name: 'agrippa',
      faction: 'Outlanders',
      realm: 'AEQUOR',
      aliases: ['agrippa'],
      tags: [],
      lineupToken: 'S',
    },
    {
      id: 'awakener-0007',
      numericId: 7,
      name: 'casiah',
      faction: 'The Fools',
      realm: 'CARO',
      aliases: ['casiah'],
      tags: [],
      lineupToken: 'n',
    },
  ],
}))

vi.mock('../../domain/wheels', () => ({
  getWheels: () => [
    {
      id: 'wheel-0050',
      assetId: 'Weapon_Full_O01',
      name: 'Merciful Nurturing',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_RATE',
      aliases: ['Merciful Nurturing'],
      tags: [],
      lineupToken: 'm',
    },
    {
      id: 'wheel-0051',
      assetId: 'Weapon_Full_O02',
      name: 'Tablet of Scriptures',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_DMG',
      aliases: ['Tablet of Scriptures'],
      tags: [],
      lineupToken: 'v',
    },
    {
      id: 'wheel-0077',
      assetId: 'Weapon_Full_SR01',
      name: 'Training Relic',
      rarity: 'SR',
      realm: 'NEUTRAL',
      awakener: '',
      mainstatKey: 'ATK',
      aliases: ['Training Relic'],
      tags: [],
      lineupToken: '5',
    },
    {
      id: 'wheel-0052',
      assetId: 'Weapon_Full_O03',
      name: 'Signal Through Silence',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'KEYFLARE_REGEN',
      aliases: ['Signal Through Silence'],
      tags: [],
      lineupToken: 'e',
    },
    {
      id: 'wheel-0053',
      assetId: 'Weapon_Full_O04',
      name: 'Mute Witness',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'ALIEMUS_REGEN',
      aliases: ['Mute Witness'],
      tags: [],
      lineupToken: '9',
    },
  ],
  getWheelMainstatLabel: () => '',
}))

vi.mock('../../domain/posses', () => ({
  getPosses: () => [
    {
      id: 'posse-0033',
      index: 33,
      name: 'Taverns Opening',
      realm: 'CHAOS',
      isFadedLegacy: false,
      awakenerName: 'goliath',
      lineupToken: 'L',
    },
    {
      id: 'posse-0003',
      index: 1,
      name: 'Warded Injection',
      realm: 'AEQUOR',
      isFadedLegacy: false,
      lineupToken: 'b',
    },
  ],
}))

vi.mock('../../domain/covenants', () => ({
  getCovenants: () => [
    {id: 'c01', assetId: 'Covenant_01', name: 'Deus Ex Machina', lineupToken: 'k'},
    {id: 'c02', assetId: 'Covenant_02', name: 'Signal Pulse', lineupToken: 'm'},
  ],
}))

vi.mock('../../domain/awakener-builds', async () => {
  const actual = await vi.importActual<typeof import('../../domain/awakener-builds')>(
    '../../domain/awakener-builds',
  )

  return {
    ...actual,
    getAwakenerBuildEntries: () => [
      {
        awakenerId: 'awakener-0021',
        primaryBuildId: 'standard',
        builds: [
          {
            id: 'standard',
            label: 'Core',
            substatPriorityGroups: [['CRIT_DMG'], ['CRIT_RATE']],
            recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN', 'CRIT_DMG'],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['wheel-0051']},
              {tier: 'GOOD', wheelIds: ['wheel-0050']},
            ],
            recommendedCovenantIds: ['c02', 'c01'],
          },
        ],
      },
    ],
    loadAwakenerBuildEntries: () =>
      Promise.resolve([
        {
          awakenerId: 'awakener-0021',
          primaryBuildId: 'standard',
          builds: [
            {
              id: 'standard',
              label: 'Core',
              substatPriorityGroups: [['CRIT_DMG'], ['CRIT_RATE']],
              recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN', 'CRIT_DMG'],
              recommendedWheels: [
                {tier: 'BIS_SSR', wheelIds: ['wheel-0051']},
                {tier: 'GOOD', wheelIds: ['wheel-0050']},
              ],
              recommendedCovenantIds: ['c02', 'c01'],
            },
          ],
        },
      ]),
  }
})

vi.mock('../../domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => `/mock/wheels/${wheelId}.webp`,
}))

vi.mock('../../domain/covenant-assets', () => ({
  getCovenantAssetById: (covenantId: string) => `/mock/covenants/${covenantId}.webp`,
}))

vi.mock('../../domain/awakener-assets', () => ({
  getAwakenerCardAsset: (awakenerName: string) => `/mock/awakeners/${awakenerName}-card.webp`,
  getAwakenerPortraitAsset: (awakenerName: string) =>
    `/mock/awakeners/${awakenerName}-portrait.webp`,
}))

vi.mock('../../domain/posse-assets', () => ({
  getPosseAssetById: (posseId: string) => `/mock/posses/${posseId}.webp`,
}))

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})
