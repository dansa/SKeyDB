import {useEffect} from 'react'

import {isDatabaseDetailNavigationKeyOwner} from '@/features/database/detail/database-detail-navigation-keys'

export function useDatabaseFamilyVariantNavigationKeys({
  onSelect,
  selectedId,
  variants,
}: {
  onSelect?: (variantId?: string) => void
  selectedId: string
  variants: readonly {id: string}[]
}) {
  useEffect(() => {
    if (!onSelect || variants.length <= 1) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isDatabaseDetailNavigationKeyOwner(event.target)
      ) {
        return
      }

      const selectedIndex = variants.findIndex((variant) => variant.id === selectedId)
      const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
      const destination = offset === 0 ? undefined : variants[selectedIndex + offset]

      if (destination) {
        event.preventDefault()
        onSelect(destination.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onSelect, selectedId, variants])
}
