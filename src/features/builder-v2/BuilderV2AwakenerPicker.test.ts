import {describe, expect, it} from 'vitest'

import {getBuilderV2PickerWindowRange} from './BuilderV2PickerWindowing'

describe('BuilderV2AwakenerPicker windowing', () => {
  it('offsets visible result indices when a clear tile leads the virtualized list', () => {
    const withoutClearTile = getBuilderV2PickerWindowRange({
      columnCount: 4,
      itemCount: 50,
      scrollTop: 448,
      viewportHeight: 112,
    })
    const withClearTile = getBuilderV2PickerWindowRange({
      columnCount: 4,
      itemCount: 50,
      leadingItemCount: 1,
      scrollTop: 448,
      viewportHeight: 112,
    })

    expect(withoutClearTile.startIndex).toBe(4)
    expect(withClearTile.startIndex).toBe(3)
    expect(withClearTile.endIndex).toBe(withoutClearTile.endIndex - 1)
    expect(withClearTile.includeLeadingItem).toBe(false)
  })

  it('keeps the clear tile in the first visible window', () => {
    expect(
      getBuilderV2PickerWindowRange({
        columnCount: 4,
        itemCount: 50,
        leadingItemCount: 1,
        scrollTop: 0,
        viewportHeight: 112,
      }).includeLeadingItem,
    ).toBe(true)
  })
})
