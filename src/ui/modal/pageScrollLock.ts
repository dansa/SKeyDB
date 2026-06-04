interface PageScrollLockSnapshot {
  bodyLeft: string
  bodyOverflow: string
  bodyPosition: string
  bodyRight: string
  bodyTop: string
  bodyWidth: string
  documentOverflow: string
  scrollX: number
  scrollY: number
}

const activePageScrollLocks = new Set<symbol>()
let pageScrollLockSnapshot: PageScrollLockSnapshot | null = null

export function acquirePageScrollLock(): symbol {
  const lockToken = Symbol('page-scroll-lock')

  if (activePageScrollLocks.size === 0) {
    const scrollX = window.scrollX
    const scrollY = window.scrollY

    pageScrollLockSnapshot = {
      bodyLeft: document.body.style.left,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyRight: document.body.style.right,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      documentOverflow: document.documentElement.style.overflow,
      scrollX,
      scrollY,
    }

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${String(scrollY)}px`
    document.body.style.left = `-${String(scrollX)}px`
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'
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
  document.body.style.overflow = snapshot.bodyOverflow
  document.body.style.position = snapshot.bodyPosition
  document.body.style.top = snapshot.bodyTop
  document.body.style.left = snapshot.bodyLeft
  document.body.style.right = snapshot.bodyRight
  document.body.style.width = snapshot.bodyWidth
  document.documentElement.style.overflow = snapshot.documentOverflow
  if (snapshot.scrollX !== 0 || snapshot.scrollY !== 0) {
    try {
      window.scrollTo(snapshot.scrollX, snapshot.scrollY)
    } catch {
      // Some test environments expose scrollTo without implementing it.
    }
  }
}
