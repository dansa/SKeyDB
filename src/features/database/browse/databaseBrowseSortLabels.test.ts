import {describe, expect, it} from 'vitest'

import {
  getDatabaseSortDirectionLabel,
  getDatabaseSortLabel,
  getWheelSortDirectionLabel,
  getWheelSortLabel,
} from './databaseBrowseSortLabels'

describe('database browse sort labels', () => {
  it('returns exact awakener database sort labels', () => {
    expect(getDatabaseSortLabel('ALPHABETICAL')).toBe('Alphabetical')
    expect(getDatabaseSortLabel('RARITY')).toBe('Rarity')
    expect(getDatabaseSortLabel('RELEASE_DATE')).toBe('Release date')
    expect(getDatabaseSortLabel('ATK')).toBe('ATK')
    expect(getDatabaseSortLabel('DEF')).toBe('DEF')
    expect(getDatabaseSortLabel('CON')).toBe('CON')
  })

  it('returns exact awakener database direction labels', () => {
    expect(getDatabaseSortDirectionLabel('ALPHABETICAL', 'ASC')).toBe('A → Z')
    expect(getDatabaseSortDirectionLabel('ALPHABETICAL', 'DESC')).toBe('Z → A')
    expect(getDatabaseSortDirectionLabel('RELEASE_DATE', 'ASC')).toBe('Old → New')
    expect(getDatabaseSortDirectionLabel('RELEASE_DATE', 'DESC')).toBe('New → Old')
    expect(getDatabaseSortDirectionLabel('ATK', 'ASC')).toBe('Low → High')
    expect(getDatabaseSortDirectionLabel('ATK', 'DESC')).toBe('High → Low')
  })

  it('returns exact wheel sort labels', () => {
    expect(getWheelSortLabel('ALPHABETICAL')).toBe('Alphabetical')
    expect(getWheelSortLabel('RARITY')).toBe('Rarity')
    expect(getWheelSortLabel('MAINSTAT')).toBe('Main stat')
  })

  it('returns exact wheel direction labels', () => {
    expect(getWheelSortDirectionLabel('RARITY', 'ASC')).toBe('Low → High')
    expect(getWheelSortDirectionLabel('RARITY', 'DESC')).toBe('High → Low')
    expect(getWheelSortDirectionLabel('ALPHABETICAL', 'ASC')).toBe('A → Z')
    expect(getWheelSortDirectionLabel('ALPHABETICAL', 'DESC')).toBe('Z → A')
    expect(getWheelSortDirectionLabel('MAINSTAT', 'ASC')).toBe('A → Z')
    expect(getWheelSortDirectionLabel('MAINSTAT', 'DESC')).toBe('Z → A')
  })
})
