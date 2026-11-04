export function orderBuilderPickerItems<T>(
  items: readonly T[],
  options: {
    sinkUnownedToBottom: boolean
    unusedFirst: boolean
    isOwned: (item: T) => boolean
    isUsed: (item: T) => boolean
  },
): T[] {
  return items.toSorted((left, right) => {
    if (options.sinkUnownedToBottom) {
      const ownership = Number(options.isOwned(right)) - Number(options.isOwned(left))
      if (ownership !== 0) return ownership
    }
    return options.unusedFirst ? Number(options.isUsed(left)) - Number(options.isUsed(right)) : 0
  })
}
