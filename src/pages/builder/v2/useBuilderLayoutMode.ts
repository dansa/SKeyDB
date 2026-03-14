import {useCallback, useEffect, useMemo, useState} from 'react'

import {getBrowserLocalStorage, safeStorageRead, safeStorageWrite} from '@/domain/storage'

export type LayoutMode = 'desktop' | 'tablet' | 'mobile'
export type LayoutOverride = 'auto' | LayoutMode

const DESKTOP_BREAKPOINT = 1024
const TABLET_BREAKPOINT = 640
const STORAGE_KEY = 'skeydb.builder.layoutOverride'

function detectLayoutMode(width: number): LayoutMode {
  if (width >= DESKTOP_BREAKPOINT) {
    return 'desktop'
  }
  if (width >= TABLET_BREAKPOINT) {
    return 'tablet'
  }
  return 'mobile'
}

function readPersistedOverride(): LayoutOverride {
  const storage = getBrowserLocalStorage()
  const value = safeStorageRead(storage, STORAGE_KEY)
  if (value === 'desktop' || value === 'tablet' || value === 'mobile') {
    return value
  }
  return 'auto'
}

function persistOverride(override: LayoutOverride): void {
  const storage = getBrowserLocalStorage()
  safeStorageWrite(storage, STORAGE_KEY, override)
}

export interface UseBuilderLayoutModeResult {
  layoutMode: LayoutMode
  layoutOverride: LayoutOverride
  detectedMode: LayoutMode
  setLayoutOverride: (override: LayoutOverride) => void
}

export function useBuilderLayoutMode(): UseBuilderLayoutModeResult {
  const [detectedMode, setDetectedMode] = useState<LayoutMode>(() =>
    typeof window !== 'undefined' ? detectLayoutMode(window.innerWidth) : 'desktop',
  )
  const [layoutOverride, setLayoutOverrideState] = useState<LayoutOverride>(readPersistedOverride)

  useEffect(() => {
    const desktopMql = window.matchMedia(`(min-width: ${String(DESKTOP_BREAKPOINT)}px)`)
    const tabletMql = window.matchMedia(
      `(min-width: ${String(TABLET_BREAKPOINT)}px) and (max-width: ${String(DESKTOP_BREAKPOINT - 1)}px)`,
    )

    function update() {
      if (desktopMql.matches) {
        setDetectedMode('desktop')
      } else if (tabletMql.matches) {
        setDetectedMode('tablet')
      } else {
        setDetectedMode('mobile')
      }
    }

    desktopMql.addEventListener('change', update)
    tabletMql.addEventListener('change', update)

    update()

    return () => {
      desktopMql.removeEventListener('change', update)
      tabletMql.removeEventListener('change', update)
    }
  }, [])

  const setLayoutOverride = useCallback((override: LayoutOverride) => {
    setLayoutOverrideState(override)
    persistOverride(override)
  }, [])

  const layoutMode = useMemo(
    () => (layoutOverride === 'auto' ? detectedMode : layoutOverride),
    [layoutOverride, detectedMode],
  )

  return {layoutMode, layoutOverride, detectedMode, setLayoutOverride}
}

export {detectLayoutMode as _detectLayoutMode}
