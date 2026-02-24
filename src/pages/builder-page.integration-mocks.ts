import { afterEach, beforeEach, vi } from 'vitest'
import { BUILDER_PERSISTENCE_KEY } from './builder/builder-persistence'

vi.mock('../domain/awakeners', () => ({
  getAwakeners: () => [
    { id: 1, name: 'goliath', faction: 'CHAOS', aliases: ['goliath'] },
    { id: 2, name: 'ramona', faction: 'CHAOS', aliases: ['ramona'] },
    { id: 3, name: 'ramona: timeworn', faction: 'CHAOS', aliases: ['timeworn ramona'] },
    { id: 4, name: 'agrippa', faction: 'AEQUOR', aliases: ['agrippa'] },
    { id: 5, name: 'casiah', faction: 'CARO', aliases: ['casiah'] },
  ],
}))

vi.mock('../domain/wheels', () => ({
  getWheels: () => [
    {
      id: 'O01',
      assetId: 'Weapon_Full_O01',
      name: 'Merciful Nurturing',
      rarity: 'SSR',
      faction: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_RATE',
    },
    {
      id: 'O02',
      assetId: 'Weapon_Full_O02',
      name: 'Tablet of Scriptures',
      rarity: 'SSR',
      faction: 'AEQUOR',
      awakener: 'goliath',
      mainstatKey: 'CRIT_DMG',
    },
    {
      id: 'SR01',
      assetId: 'Weapon_Full_SR01',
      name: 'Training Relic',
      rarity: 'SR',
      faction: 'NEUTRAL',
      awakener: '',
      mainstatKey: 'ATK',
    },
  ],
  getWheelMainstatLabel: () => '',
}))

vi.mock('../domain/posses', () => ({
  getPosses: () => [
    { id: '33', index: 33, name: 'Taverns Opening', faction: 'CHAOS', isFadedLegacy: false, awakenerName: 'goliath' },
    { id: '01', index: 1, name: 'Warded Injection', faction: 'AEQUOR', isFadedLegacy: false },
  ],
}))

vi.mock('../domain/covenants', () => ({
  getCovenants: () => [
    { id: 'c01', assetId: 'Covenant_01', name: 'Deus Ex Machina' },
    { id: 'c02', assetId: 'Covenant_02', name: 'Signal Pulse' },
  ],
}))

vi.mock('../domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => `/mock/wheels/${wheelId}.png`,
}))

vi.mock('../domain/covenant-assets', () => ({
  getCovenantAssetById: (covenantId: string) => `/mock/covenants/${covenantId}.png`,
}))

vi.mock('../domain/awakener-assets', () => ({
  getAwakenerCardAsset: (awakenerName: string) => `/mock/awakeners/${awakenerName}-card.png`,
  getAwakenerPortraitAsset: (awakenerName: string) => `/mock/awakeners/${awakenerName}-portrait.png`,
}))

vi.mock('../domain/posse-assets', () => ({
  getPosseAssetById: (posseId: string) => `/mock/posses/${posseId}.png`,
}))

beforeEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})

afterEach(() => {
  window.localStorage.removeItem(BUILDER_PERSISTENCE_KEY)
})
