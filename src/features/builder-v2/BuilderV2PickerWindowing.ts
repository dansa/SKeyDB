export const builderV2PickerWindowThreshold = 40
export const builderV2PickerWindowRowHeight = 112
export const builderV2PickerWindowRowBuffer = 3
export const builderV2PickerWindowFallbackColumnCount = 4
export const builderV2PickerWindowFallbackViewportHeight = 640

export interface BuilderV2PickerWindowRange {
  afterHeight: number
  beforeHeight: number
  endIndex: number
  includeLeadingItem: boolean
  startIndex: number
}

export function getBuilderV2PickerWindowRange({
  columnCount,
  itemCount,
  leadingItemCount = 0,
  scrollTop,
  viewportHeight,
}: {
  columnCount: number
  itemCount: number
  leadingItemCount?: number
  scrollTop: number
  viewportHeight: number
}): BuilderV2PickerWindowRange {
  const safeColumnCount = Math.max(1, columnCount)
  const totalItemCount = itemCount + leadingItemCount
  const totalRows = Math.ceil(totalItemCount / safeColumnCount)
  const firstVisibleRow = Math.floor(scrollTop / builderV2PickerWindowRowHeight)
  const visibleRowCount = Math.ceil(viewportHeight / builderV2PickerWindowRowHeight)
  const startRow = Math.max(0, firstVisibleRow - builderV2PickerWindowRowBuffer)
  const endRow = Math.min(
    totalRows,
    firstVisibleRow + visibleRowCount + builderV2PickerWindowRowBuffer,
  )
  const startVirtualIndex = startRow * safeColumnCount
  const endVirtualIndex = Math.min(totalItemCount, endRow * safeColumnCount)

  return {
    afterHeight: Math.max(0, (totalRows - endRow) * builderV2PickerWindowRowHeight),
    beforeHeight: startRow * builderV2PickerWindowRowHeight,
    endIndex: Math.max(0, Math.min(itemCount, endVirtualIndex - leadingItemCount)),
    includeLeadingItem: leadingItemCount > 0 && startVirtualIndex <= 0 && endVirtualIndex > 0,
    startIndex: Math.max(0, startVirtualIndex - leadingItemCount),
  }
}
