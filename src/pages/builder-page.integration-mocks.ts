import { vi } from 'vitest'

vi.mock('../domain/wheel-assets', () => ({
  getWheelAssetById: (wheelId: string) => `/mock/wheels/${wheelId}.png`,
}))

vi.mock('../domain/covenant-assets', () => ({
  getCovenantAssetById: (covenantId: string) => `/mock/covenants/${covenantId}.png`,
}))

