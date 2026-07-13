import {useLayoutEffect, type Dispatch, type RefObject, type SetStateAction} from 'react'

interface UseBuilderPageLayoutObserverProps {
  builderSectionRef: RefObject<HTMLElement | null>
  mainBuilderZoneRef: RefObject<HTMLDivElement | null>
  pickerZoneRef: RefObject<HTMLElement | null>
  setMainBuilderZoneHeight: Dispatch<SetStateAction<number | null>>
  setPickerShellHeight: Dispatch<SetStateAction<number | null>>
}

export function useBuilderPageLayoutObserver({
  builderSectionRef,
  mainBuilderZoneRef,
  pickerZoneRef,
  setMainBuilderZoneHeight,
  setPickerShellHeight,
}: UseBuilderPageLayoutObserverProps) {
  useLayoutEffect(() => {
    const builderSection = builderSectionRef.current
    const mainBuilderZone = mainBuilderZoneRef.current
    const pickerZone = pickerZoneRef.current
    if (!builderSection || !mainBuilderZone || !pickerZone) {
      return
    }
    const pageMain = pickerZone.closest('main')

    const syncMetric = (
      setMetric: Dispatch<SetStateAction<number | null>>,
      nextMetric: number | null,
    ) => {
      setMetric((previousMetric) => (previousMetric === nextMetric ? previousMetric : nextMetric))
    }

    const measureLayout = () => {
      const nextMainBuilderZoneHeight = Math.round(mainBuilderZone.getBoundingClientRect().height)
      if (nextMainBuilderZoneHeight <= 0) {
        syncMetric(setMainBuilderZoneHeight, null)
        syncMetric(setPickerShellHeight, null)
        return
      }

      const mainPaddingBottom =
        pageMain instanceof HTMLElement
          ? Number.parseFloat(window.getComputedStyle(pageMain).paddingBottom) || 0
          : 0
      const availableViewportHeight = Math.max(
        0,
        Math.round(window.innerHeight - pickerZone.getBoundingClientRect().top - mainPaddingBottom),
      )

      syncMetric(setMainBuilderZoneHeight, nextMainBuilderZoneHeight)
      syncMetric(setPickerShellHeight, Math.max(nextMainBuilderZoneHeight, availableViewportHeight))
    }

    measureLayout()
    window.addEventListener('resize', measureLayout)

    if (!('ResizeObserver' in window)) {
      return () => {
        window.removeEventListener('resize', measureLayout)
      }
    }

    const observer = new ResizeObserver(() => {
      measureLayout()
    })

    observer.observe(builderSection)
    observer.observe(mainBuilderZone)
    if (pageMain instanceof HTMLElement) {
      observer.observe(pageMain)
    }

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureLayout)
    }
  }, [
    builderSectionRef,
    mainBuilderZoneRef,
    pickerZoneRef,
    setMainBuilderZoneHeight,
    setPickerShellHeight,
  ])
}
