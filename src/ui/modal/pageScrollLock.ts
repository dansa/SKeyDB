interface PageScrollLockSnapshot {
  documentOverflow: string
  documentScrollbarGutter: string
  scrollX: number
  scrollY: number
}

const activePageScrollLocks = new Set<symbol>()
let pageScrollLockSnapshot: PageScrollLockSnapshot | null = null
let scrollRestoreGeneration = 0

export function acquirePageScrollLock(): symbol {
  const lockToken = Symbol('page-scroll-lock')

  if (activePageScrollLocks.size === 0) {
    scrollRestoreGeneration += 1
    pageScrollLockSnapshot = {
      documentOverflow: document.documentElement.style.overflow,
      documentScrollbarGutter: document.documentElement.style.scrollbarGutter,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    }

    // Keep body in the page coordinate space so sticky and fixed app chrome stay anchored.
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.scrollbarGutter = 'stable'
    window.addEventListener('scroll', restoreLockedPagePosition, {passive: true})
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
  window.removeEventListener('scroll', restoreLockedPagePosition)
  document.documentElement.style.overflow = snapshot.documentOverflow
  document.documentElement.style.scrollbarGutter = snapshot.documentScrollbarGutter
  restorePagePosition(snapshot)
  scheduleSettledPagePositionRestore(snapshot)
}

function restoreLockedPagePosition() {
  if (pageScrollLockSnapshot) {
    restorePagePosition(pageScrollLockSnapshot)
  }
}

function restorePagePosition(snapshot: PageScrollLockSnapshot) {
  if (window.scrollX === snapshot.scrollX && window.scrollY === snapshot.scrollY) {
    return
  }

  window.scrollTo(snapshot.scrollX, snapshot.scrollY)
}

function scheduleSettledPagePositionRestore(snapshot: PageScrollLockSnapshot) {
  const restoreGeneration = ++scrollRestoreGeneration

  window.requestAnimationFrame(() => {
    if (activePageScrollLocks.size > 0 || scrollRestoreGeneration !== restoreGeneration) {
      return
    }

    restorePagePosition(snapshot)
    window.requestAnimationFrame(() => {
      if (activePageScrollLocks.size === 0 && scrollRestoreGeneration === restoreGeneration) {
        restorePagePosition(snapshot)
      }
    })
  })
}
