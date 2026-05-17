import {useCallback, useLayoutEffect, useState, type ReactNode} from 'react'

import {
  HybridDatabaseCardModeContext,
  type HybridDatabaseCardMode,
} from './hybrid-database-card-mode'

interface CatalogGridProps<TItem> {
  items: TItem[]
  emptyMessage: string
  renderItem: (item: TItem, index: number) => ReactNode
  layout?: 'hybrid' | 'portrait' | 'square-art'
}

const HYBRID_DOSSIER_CONTAINER_WIDTH = 620

function resolveHybridDatabaseCardMode(inlineSize: number): HybridDatabaseCardMode {
  return inlineSize <= HYBRID_DOSSIER_CONTAINER_WIDTH ? 'dossier' : 'poster'
}

function useMeasuredHybridCardMode(isHybridGrid: boolean, hasItems: boolean) {
  const [element, setElement] = useState<HTMLDivElement | null>(null)
  const [mode, setMode] = useState<HybridDatabaseCardMode | null>(isHybridGrid ? null : 'poster')
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      setElement(node)
      if (!isHybridGrid || !hasItems || !node) {
        return
      }
      const inlineSize = node.getBoundingClientRect().width
      if (inlineSize > 0) {
        setMode(resolveHybridDatabaseCardMode(inlineSize))
      }
    },
    [hasItems, isHybridGrid],
  )

  useLayoutEffect(() => {
    if (!isHybridGrid) {
      return undefined
    }

    if (!hasItems) {
      return undefined
    }

    if (!element) {
      return undefined
    }

    const updateMode = (inlineSize: number) => {
      if (inlineSize <= 0) {
        setMode('poster')
        return
      }
      setMode(resolveHybridDatabaseCardMode(inlineSize))
    }

    const measureElement = () => {
      updateMode(element.getBoundingClientRect().width)
    }
    const frame = requestAnimationFrame(measureElement)
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measureElement)
      return () => {
        cancelAnimationFrame(frame)
        window.removeEventListener('resize', measureElement)
      }
    }
    window.addEventListener('resize', measureElement)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      const inlineSize = entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
      updateMode(inlineSize)
    })
    observer.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', measureElement)
      observer.disconnect()
    }
  }, [element, hasItems, isHybridGrid])

  return {mode, ref}
}

export function DatabaseCatalogGrid<TItem>({
  emptyMessage,
  items,
  layout = 'portrait',
  renderItem,
}: CatalogGridProps<TItem>) {
  const isHybridGrid = layout === 'hybrid'
  const {mode, ref} = useMeasuredHybridCardMode(isHybridGrid, items.length > 0)
  const gridClassName =
    layout === 'hybrid'
      ? 'database-card-grid database-card-grid--hybrid'
      : layout === 'square-art'
        ? 'database-card-grid database-card-grid--square-art'
        : 'database-card-grid'

  if (items.length === 0) {
    return (
      <div className='border border-slate-700/55 bg-[linear-gradient(180deg,rgba(15,23,42,0.4),rgba(9,15,27,0.28))] px-4 py-12 text-center text-sm text-slate-400'>
        {emptyMessage}
      </div>
    )
  }

  return (
    <HybridDatabaseCardModeContext.Provider value={mode}>
      <div className='database-card-roster' data-hybrid-mode={mode ?? 'pending'} ref={ref}>
        <div className={gridClassName}>{items.map((item, index) => renderItem(item, index))}</div>
      </div>
    </HybridDatabaseCardModeContext.Provider>
  )
}
