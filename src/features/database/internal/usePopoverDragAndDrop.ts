import {useEffect, useRef, useState} from 'react'

interface UsePopoverDragAndDropOptions {
  isDragging: boolean
  transform: {x: number; y: number} | null
}

export function usePopoverDragAndDrop({isDragging, transform}: UsePopoverDragAndDropOptions) {
  const lastDragX = useRef(0)
  const lastTime = useRef(0)
  const transformXRef = useRef(0)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    transformXRef.current = transform?.x ?? 0
  }, [transform?.x])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    let rafId: number
    const updateRotation = () => {
      const now = performance.now()
      const dt = Math.max(1, now - lastTime.current)
      const currentDragX = transformXRef.current
      const velocity = (currentDragX - lastDragX.current) / dt

      setRotation((prev) => {
        const next = prev * 0.9 + velocity * 8 * 0.1
        return Math.max(-4, Math.min(4, next))
      })

      lastDragX.current = currentDragX
      lastTime.current = now
      rafId = requestAnimationFrame(updateRotation)
    }

    lastTime.current = performance.now()
    lastDragX.current = transformXRef.current
    rafId = requestAnimationFrame(updateRotation)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [isDragging])

  if (!isDragging && rotation !== 0) {
    setRotation(0)
  }

  const dragX = transform?.x ?? 0
  const dragY = transform?.y ?? 0

  return {
    rotation,
    dragX,
    dragY,
  }
}
