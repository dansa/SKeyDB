import {act, cleanup} from '@testing-library/react'
import {afterEach, beforeEach, vi} from 'vitest'

import {
  createMockPublicAwakener,
  createMockPublicCatalog,
  createMockPublicCovenant,
  createMockPublicPosse,
  createMockPublicWheel,
} from '@/test/publicCatalogFixtures'

import {BUILDER_PERSISTENCE_KEY} from './builder-persistence'

function createBuilderMockPublicCatalog() {
  return createMockPublicCatalog({
    awakeners: [
      createMockPublicAwakener({
        id: 'awakener-0021',
        numericId: 21,
        name: 'goliath',
        faction: 'Among the Stars',
        realm: 'CHAOS',
        aliases: ['goliath'],
        lineupToken: 'f',
      }),
      createMockPublicAwakener({
        id: 'awakener-0042',
        numericId: 42,
        name: 'ramona',
        realm: 'CHAOS',
        aliases: ['ramona'],
        lineupToken: 'N',
      }),
      createMockPublicAwakener({
        id: 'awakener-0020',
        numericId: 20,
        name: 'ramona: timeworn',
        realm: 'CHAOS',
        aliases: ['timeworn ramona'],
        lineupToken: 'j',
      }),
      createMockPublicAwakener({
        id: 'awakener-0002',
        numericId: 2,
        name: 'agrippa',
        faction: 'Outlanders',
        realm: 'AEQUOR',
        aliases: ['agrippa'],
        lineupToken: 'S',
      }),
      createMockPublicAwakener({
        id: 'awakener-0007',
        numericId: 7,
        name: 'casiah',
        realm: 'CARO',
        aliases: ['casiah'],
        lineupToken: 'n',
      }),
    ],
    wheels: [
      createMockPublicWheel({
        id: 'wheel-0050',
        assetId: 'Weapon_Full_O01',
        name: 'Merciful Nurturing',
        realm: 'AEQUOR',
        awakener: 'goliath',
        mainstatKey: 'CRIT_RATE',
        aliases: ['Merciful Nurturing'],
        lineupToken: 'm',
      }),
      createMockPublicWheel({
        id: 'wheel-0051',
        assetId: 'Weapon_Full_O02',
        name: 'Tablet of Scriptures',
        realm: 'AEQUOR',
        awakener: 'goliath',
        mainstatKey: 'CRIT_DMG',
        aliases: ['Tablet of Scriptures'],
        lineupToken: 'v',
      }),
      createMockPublicWheel({
        id: 'wheel-0077',
        assetId: 'Weapon_Full_SR01',
        name: 'Training Relic',
        rarity: 'SR',
        aliases: ['Training Relic'],
        lineupToken: '5',
      }),
      createMockPublicWheel({
        id: 'wheel-0052',
        assetId: 'Weapon_Full_O03',
        name: 'Signal Through Silence',
        realm: 'AEQUOR',
        awakener: 'goliath',
        mainstatKey: 'KEYFLARE_REGEN',
        aliases: ['Signal Through Silence'],
        lineupToken: 'e',
      }),
      createMockPublicWheel({
        id: 'wheel-0053',
        assetId: 'Weapon_Full_O04',
        name: 'Mute Witness',
        realm: 'AEQUOR',
        awakener: 'goliath',
        mainstatKey: 'ALIEMUS_REGEN',
        aliases: ['Mute Witness'],
        lineupToken: '9',
      }),
    ],
    posses: [
      createMockPublicPosse({
        id: 'posse-0033',
        index: 33,
        name: 'Taverns Opening',
        realm: 'CHAOS',
        awakenerName: 'goliath',
        lineupToken: 'L',
      }),
      createMockPublicPosse({
        id: 'posse-0003',
        index: 1,
        name: 'Warded Injection',
        realm: 'AEQUOR',
        lineupToken: 'b',
      }),
    ],
    covenants: [
      createMockPublicCovenant({
        id: 'c01',
        assetId: 'Covenant_01',
        name: 'Deus Ex Machina',
        lineupToken: 'k',
      }),
      createMockPublicCovenant({
        id: 'c02',
        assetId: 'Covenant_02',
        name: 'Signal Pulse',
        lineupToken: 'm',
      }),
    ],
  })
}

vi.mock('../../domain/awakeners', () => ({
  getAwakeners: () => createBuilderMockPublicCatalog().awakeners,
}))

vi.mock('../../domain/wheels', () => ({
  getWheels: () => createBuilderMockPublicCatalog().wheels,
  getWheelMainstatLabel: () => '',
}))

vi.mock('../../domain/posses', () => ({
  getPosses: () => createBuilderMockPublicCatalog().posses,
}))

vi.mock('../../domain/covenants', () => ({
  getCovenants: () => createBuilderMockPublicCatalog().covenants,
}))

vi.mock('@/domain/public-detail-record-adapters', () => ({
  loadPublicAwakenerDetailById: () => Promise.resolve(undefined),
  loadPublicCovenantDetailById: () => Promise.resolve(undefined),
  loadPublicPosseDetailById: () => Promise.resolve(undefined),
  loadPublicWheelDetailById: () => Promise.resolve(undefined),
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
  getWheelMiniAssetById: (wheelId: string) => `/mock/wheels/mini/${wheelId}.webp`,
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

beforeEach(async () => {
  const [{createEmptyCollectionOwnershipState}, {collectionOwnershipStore}] = await Promise.all([
    import('@/domain/collection-ownership'),
    import('@/stores/collectionOwnershipStore'),
  ])

  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
  collectionOwnershipStore.getState().replaceOwnership(createEmptyCollectionOwnershipState())
})

afterEach(async () => {
  const [{createEmptyCollectionOwnershipState}, {collectionOwnershipStore}, {dbDetailStore}] =
    await Promise.all([
      import('@/domain/collection-ownership'),
      import('@/stores/collectionOwnershipStore'),
      import('@/stores/dbDetailStore'),
    ])

  cleanup()
  act(() => {
    dbDetailStore.getState().closeAllDetails()
  })
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
  collectionOwnershipStore.getState().replaceOwnership(createEmptyCollectionOwnershipState())
})
