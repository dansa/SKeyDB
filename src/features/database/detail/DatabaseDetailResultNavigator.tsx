import {useEffect} from 'react'

import {FaChevronLeft, FaChevronRight} from 'react-icons/fa6'

import type {
  DatabaseDetailResultNavigation,
  DatabaseDetailResultNavigationPreview,
  DatabaseDetailResultNavigationTarget,
} from './database-detail-result-navigation'

interface DatabaseDetailResultNavigatorProps {
  navigation: DatabaseDetailResultNavigation | null
}

interface ResultButtonProps {
  direction: 'Previous' | 'Next'
  target: DatabaseDetailResultNavigationTarget
  onSelect: () => void
}

function isEmptyDetailSearchInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    element.hasAttribute('data-detail-search-input') &&
    element.value.trim().length === 0
  )
}

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  if (target.closest('[role="tablist"]')) {
    return true
  }

  if (target instanceof HTMLElement && target.isContentEditable) {
    return true
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  )
}

function useDatabaseDetailResultNavigationKeys(navigation: DatabaseDetailResultNavigation | null) {
  useEffect(() => {
    if (!navigation) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTextEditingTarget(event.target)
      ) {
        return
      }

      if (event.key === 'ArrowLeft' && navigation.previous) {
        event.preventDefault()
        navigation.onPrevious()
      } else if (event.key === 'ArrowRight' && navigation.next) {
        event.preventDefault()
        navigation.onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigation])
}

function useClearInheritedDetailSearchFocus(currentId: string | null) {
  useEffect(() => {
    if (!currentId) {
      return
    }

    const clearFocus = () => {
      const activeElement = document.activeElement
      if (activeElement && isEmptyDetailSearchInput(activeElement)) {
        activeElement.blur()
      }
    }

    clearFocus()
    const animationFrame = window.requestAnimationFrame(clearFocus)
    const timeout = window.setTimeout(clearFocus, 0)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timeout)
    }
  }, [currentId])
}

function getResultImageFrameClass(preview: DatabaseDetailResultNavigationPreview): string {
  const baseClass = 'block h-6 w-6 shrink-0 overflow-hidden min-[28rem]:h-7 min-[28rem]:w-7'

  if (preview.imageTreatment === 'icon' || preview.imageTreatment === 'covenant-icon') {
    return `${baseClass} bg-transparent`
  }

  return `${baseClass} border border-amber-200/16 bg-slate-950/80`
}

function getResultImageClass(preview: DatabaseDetailResultNavigationPreview): string {
  if (preview.imageTreatment === 'icon') {
    return 'h-full w-full object-contain object-center'
  }
  if (preview.imageTreatment === 'covenant-icon') {
    return 'h-full w-full scale-125 object-contain object-center'
  }
  return 'h-full w-full object-cover object-center'
}

function ResultButton({direction, onSelect, target}: ResultButtonProps) {
  const isPrevious = direction === 'Previous'
  const Icon = isPrevious ? FaChevronLeft : FaChevronRight
  const label = `${direction} result: ${target.preview.label}`
  const baseClass =
    'group inline-flex h-11 min-w-0 items-center gap-2 border border-amber-200/18 bg-slate-950/[.96] px-2 text-left text-slate-300 shadow-[0_12px_26px_rgba(2,6,23,0.45)] transition-colors hover:border-amber-200/45 hover:text-amber-50 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none sm:px-2.5 motion-reduce:transition-none'

  return (
    <button aria-label={label} className={baseClass} onClick={onSelect} type='button'>
      <span
        className={`flex min-w-0 flex-1 items-center gap-2 ${isPrevious ? '' : 'flex-row-reverse'}`}
      >
        <Icon aria-hidden className='h-3 w-3 shrink-0 text-amber-200/75' />
        {target.preview.imageSrc ? (
          <span className={getResultImageFrameClass(target.preview)}>
            <img
              alt=''
              className={getResultImageClass(target.preview)}
              src={target.preview.imageSrc}
            />
          </span>
        ) : null}
        <span className='min-w-0 flex-1'>
          <span className='block text-[9px] leading-none font-black tracking-[0.14em] text-amber-200/75 uppercase'>
            {direction}
          </span>
          <span className='mt-1 block truncate text-xs leading-tight font-semibold text-amber-50'>
            {target.preview.label}
          </span>
        </span>
      </span>
    </button>
  )
}

function ResultPlaceholder() {
  return <div aria-hidden className='h-11 min-w-0 border border-amber-200/10 bg-slate-950/[.94]' />
}

export function DatabaseDetailResultNavigator({navigation}: DatabaseDetailResultNavigatorProps) {
  useDatabaseDetailResultNavigationKeys(navigation)
  useClearInheritedDetailSearchFocus(navigation?.current.ref.id ?? null)

  if (!navigation) {
    return null
  }

  const positionLabel = `${(navigation.current.index + 1).toString()} / ${navigation.current.total.toString()}`

  return (
    <div
      aria-label='Database result navigation'
      data-detail-modal-external=''
      data-detail-result-navigation=''
    >
      <div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2'>
        {navigation.previous ? (
          <ResultButton
            direction='Previous'
            onSelect={navigation.onPrevious}
            target={navigation.previous}
          />
        ) : (
          <ResultPlaceholder />
        )}
        <span className='shrink-0 border border-amber-200/14 bg-slate-950/[.96] px-2.5 py-2 text-[10px] leading-none font-black tracking-[0.12em] text-slate-400 tabular-nums'>
          {positionLabel}
        </span>
        {navigation.next ? (
          <ResultButton direction='Next' onSelect={navigation.onNext} target={navigation.next} />
        ) : (
          <ResultPlaceholder />
        )}
      </div>
    </div>
  )
}
