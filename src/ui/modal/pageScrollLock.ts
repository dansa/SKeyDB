interface PageScrollLockSnapshot {
  documentOverflow: string
  documentScrollbarGutter: string
}

const activePageScrollLocks = new Set<symbol>()
let pageScrollLockSnapshot: PageScrollLockSnapshot | null = null

export function acquirePageScrollLock(): symbol {
  const lockToken = Symbol('page-scroll-lock')

  if (activePageScrollLocks.size === 0) {
    pageScrollLockSnapshot = {
      documentOverflow: document.documentElement.style.overflow,
      documentScrollbarGutter: document.documentElement.style.scrollbarGutter,
    }

    // Keep body in the page coordinate space so sticky and fixed app chrome stay anchored.
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.scrollbarGutter = 'stable'
  }

  activePageScrollLocks.add(lockToken)
  return lockToken
}

export function releasePageScrollLock(lockToken: symbol) {
  activePageScrollLocks.delete(lockToken)
  if (activePageScrollLocks.size > 0 || !pageScrollLockSnapshot) {
    return
  }

  const snapshot = pageScrollLockSnapshot
  pageScrollLockSnapshot = null
  document.documentElement.style.overflow = snapshot.documentOverflow
  document.documentElement.style.scrollbarGutter = snapshot.documentScrollbarGutter
}
