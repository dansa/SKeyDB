import {afterEach, beforeEach, vi} from 'vitest'

import {BUILDER_PERSISTENCE_KEY} from './builder/builder-persistence'

vi.mock('../domain/awakeners', () => ({
  getAwakeners: () => [
    {id: 1, name: 'goliath', faction: 'Among the Stars', realm: 'CHAOS', aliases: ['goliath']},
    {id: 2, name: 'ramona', faction: 'The Fools', realm: 'CHAOS', aliases: ['ramona']},
    {
      id: 3,
      name: 'ramona: timeworn',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['timeworn ramona'],
    },
    {id: 4, name: 'agrippa', faction: 'Outlanders', realm: 'AEQUOR', aliases: ['agrippa']},
    {id: 5, name: 'casiah', faction: 'The Fools', realm: 'CARO', aliases: ['casiah']},
  ],
}))

vi.mock('../domain/wheels', () => ({
  getWheels: () => [
    {
      id: 'O01',
      assetId: 'Weapon_Full_O01',
      name: 'Merciful Nurturing',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_RATE',
    },
    {
      id: 'O02',
      assetId: 'Weapon_Full_O02',
      name: 'Tablet of Scriptures',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_DMG',
    },
    {
      id: 'SR01',
      assetId: 'Weapon_Full_SR01',
      name: 'Training Relic',
      rarity: 'SR',
      realm: 'NEUTRAL',
      awakener: '',
      mainstatKey: 'ATK',
    },
    {
      id: 'O03',
      assetId: 'Weapon_Full_O03',
      name: 'Signal Through Silence',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'KEYFLARE_REGEN',
    },
    {
      id: 'O04',
      assetId: 'Weapon_Full_O04',
      name: 'Mute Witness',
      rarity: 'SSR',
      realm: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'ALIEMUS_REGEN',
    },
  ],
  getWheelMainstatLabel: () => '',
}))

vi.mock('../domain/posses', () => ({
  getPosses: () => [
    {
      id: '33',
      index: 33,
      name: 'Taverns Opening',
      realm: 'CHAOS',
      isFadedLegacy: false,
      awakenerName: 'goliath',
    },
    {id: '01', index: 1, name: 'Warded Injection', realm: 'AEQUOR', isFadedLegacy: false},
  ],
}))

vi.mock('../domain/covenants', () => ({
  getCovenants: () => [
    {id: 'c01', assetId: 'Covenant_01', name: 'Deus Ex Machina'},
    {id: 'c02', assetId: 'Covenant_02', name: 'Signal Pulse'},
  ],
}))

vi.mock('../domain/awakener-builds', async () => {
  const actual = await vi.importActual<typeof import('../domain/awakener-builds')>(
    '../domain/awakener-builds',
  )

  return {
    ...actual,
    getAwakenerBuildEntries: () => [
      {
        awakenerId: 1,
        primaryBuildId: 'standard',
        builds: [
          {
            id: 'standard',
            label: 'Core',
            substatPriorityGroups: [['CRIT_DMG'], ['CRIT_RATE']],
            recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN', 'CRIT_DMG'],
            recommendedWheels: [
              {tier: 'BIS_SSR', wheelIds: ['O02']},
              {tier: 'GOOD', wheelIds: ['O01']},
            ],
            recommendedCovenantIds: ['c02', 'c01'],
          },
        ],
      },
    ],
    loadAwakenerBuildEntries: () =>
      Promise.resolve([
        {
          awakenerId: 1,
          primaryBuildId: 'standard',
          builds: [
            {
              id: 'standard',
              label: 'Core',
              substatPriorityGroups: [['CRIT_DMG'], ['CRIT_RATE']],
              recommendedWheelMainstats: ['KEYFLARE_REGEN', 'ALIEMUS_REGEN', 'CRIT_DMG'],
              recommendedWheels: [
                {tier: 'BIS_SSR', wheelIds: ['O02']},
                {tier: 'GOOD', wheelIds: ['O01']},
              ],
              recommendedCovenantIds: ['c02', 'c01'],
            },
          ],
        },
      ]),
  }
})

vi.mock('../domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => `/mock/wheels/${wheelId}.webp`,
}))

vi.mock('../domain/covenant-assets', () => ({
  getCovenantAssetById: (covenantId: string) => `/mock/covenants/${covenantId}.webp`,
}))

vi.mock('../domain/awakener-assets', () => ({
  getAwakenerCardAsset: (awakenerName: string) => `/mock/awakeners/${awakenerName}-card.webp`,
  getAwakenerPortraitAsset: (awakenerName: string) =>
    `/mock/awakeners/${awakenerName}-portrait.webp`,
}))

vi.mock('../domain/posse-assets', () => ({
  getPosseAssetById: (posseId: string) => `/mock/posses/${posseId}.webp`,
}))

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})
