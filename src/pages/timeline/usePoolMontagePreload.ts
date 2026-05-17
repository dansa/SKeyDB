import {useEffect, useMemo, useRef, useState} from 'react'

import {getPoolPreloadUrls, type ResolvedVisualSlot} from './timelineArtworkModel'

const COMBO_PRELOAD_ROOT_MARGIN = '720px'
const COMBO_PRELOAD_BATCH_SIZE = 4
const COMBO_PRELOAD_BATCH_DELAY_MS = 80

const imagePreloadCache = new Map<string, Promise<void>>()
const noCleanup: () => void = () => undefined

function finishImageDecode(image: HTMLImageElement): Promise<void> {
  if (typeof image.decode !== 'function') {
    return Promise.resolve()
  }

  return image.decode().then(
    () => undefined,
    () => undefined,
  )
}

function preloadTimelineImage(url: string | undefined): Promise<void> {
  if (!url || typeof window === 'undefined' || typeof window.Image === 'undefined') {
    return Promise.resolve()
  }

  const cached = imagePreloadCache.get(url)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new window.Image()
    image.decoding = 'async'
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      void finishImageDecode(image).then(resolve)
    }

    const finishDecoded = () => {
      if (settled) return
      settled = true
      resolve()
    }

    image.onload = finish
    image.onerror = () => {
      resolve()
    }
    image.src = url

    if (image.complete) {
      finish()
    } else if (typeof image.decode === 'function') {
      void finishImageDecode(image).then(finishDecoded)
    }
  })

  imagePreloadCache.set(url, promise)
  return promise
}

function preloadTimelineImagesInBatches(urls: string[], onComplete?: () => void): () => void {
  if (typeof window === 'undefined' || urls.length === 0) {
    onComplete?.()
    return noCleanup
  }

  let cancelled = false
  let nextIndex = 0
  let timer: number | undefined
  const promises: Promise<void>[] = []

  const preloadNextBatch = () => {
    if (cancelled) return

    const batch = urls.slice(nextIndex, nextIndex + COMBO_PRELOAD_BATCH_SIZE)
    batch.forEach((url) => {
      promises.push(preloadTimelineImage(url))
    })
    nextIndex += COMBO_PRELOAD_BATCH_SIZE

    if (nextIndex < urls.length) {
      timer = window.setTimeout(preloadNextBatch, COMBO_PRELOAD_BATCH_DELAY_MS)
    } else if (onComplete) {
      void Promise.all(promises).then(() => {
        if (!cancelled) {
          onComplete()
        }
      })
    }
  }

  timer = window.setTimeout(preloadNextBatch, 0)

  return () => {
    cancelled = true
    if (timer !== undefined) {
      window.clearTimeout(timer)
    }
  }
}

export function usePoolMontagePreload(
  visualSlots: ResolvedVisualSlot[],
  onReadyChange: (ready: boolean) => void,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [shouldPreload, setShouldPreload] = useState(
    () => typeof IntersectionObserver === 'undefined' || import.meta.env.MODE === 'test',
  )
  const preloadUrls = useMemo(() => getPoolPreloadUrls(visualSlots), [visualSlots])
  const preloadSignature = preloadUrls.join('\n')
  const [readySignature, setReadySignature] = useState(() =>
    import.meta.env.MODE === 'test' ? preloadSignature : '',
  )
  const assetsReady = import.meta.env.MODE === 'test' || readySignature === preloadSignature

  useEffect(() => {
    onReadyChange(assetsReady)
  }, [assetsReady, onReadyChange])

  useEffect(() => {
    if (shouldPreload) return

    const node = rootRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setShouldPreload(true)
        observer.disconnect()
      },
      {rootMargin: COMBO_PRELOAD_ROOT_MARGIN},
    )
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [shouldPreload])

  useEffect(() => {
    if (!shouldPreload) return
    if (import.meta.env.MODE === 'test') {
      return
    }

    return preloadTimelineImagesInBatches(preloadUrls, () => {
      setReadySignature(preloadSignature)
    })
  }, [preloadSignature, preloadUrls, shouldPreload])

  return {assetsReady, rootRef}
}
