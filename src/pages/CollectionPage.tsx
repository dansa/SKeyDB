import {useMemo, useRef, type ChangeEvent, type WheelEvent} from 'react'

import {Toast} from '@/components/ui/Toast'
import {useTimedToast} from '@/components/ui/useTimedToast'

import {CollectionPageResults} from './collection/CollectionPageResults'
import {CollectionPageSidebar} from './collection/CollectionPageSidebar'
import {CollectionPageToolbar} from './collection/CollectionPageToolbar'
import {useCollectionViewModel} from './collection/useCollectionViewModel'
import {useGlobalCollectionSearchCapture} from './collection/useGlobalCollectionSearchCapture'
import {createOwnedAwakenerBoxEntries} from './collection/useOwnedAwakenerBoxEntries'
import {createOwnedWheelBoxEntries} from './collection/useOwnedWheelBoxEntries'

function getCollectionLoadErrorMessage(
  error: 'invalid_json' | 'unsupported_version' | 'invalid_payload',
) {
  if (error === 'invalid_json') {
    return 'Load failed: file is not valid JSON.'
  }

  if (error === 'unsupported_version') {
    return 'Load failed: snapshot version is unsupported.'
  }

  return 'Load failed: file does not match collection snapshot format.'
}

export function CollectionPage() {
  const model = useCollectionViewModel()
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const importFileInputRef = useRef<HTMLInputElement | null>(null)
  const {toastEntries, showToast} = useTimedToast({defaultDurationMs: 3200})
  const ownedAwakenersForBoxExport = useMemo(
    () => createOwnedAwakenerBoxEntries(model.getAwakenerOwnedLevel, model.getAwakenerLevel),
    [model.getAwakenerOwnedLevel, model.getAwakenerLevel],
  )
  const ownedWheelsForBoxExport = useMemo(
    () => createOwnedWheelBoxEntries(model.getWheelOwnedLevel),
    [model.getWheelOwnedLevel],
  )

  useGlobalCollectionSearchCapture({
    searchInputRef,
    onAppendCharacter: model.appendSearchCharacter,
    onClearSearch: model.clearActiveQuery,
  })

  function swallowOutsideLevelClickIfCardInteraction(event: MouseEvent | PointerEvent) {
    const target = event.target
    if (!(target instanceof Element)) {
      return
    }

    const interactionFrame = target.closest('.collection-card-frame')
    if (!interactionFrame) {
      return
    }

    // Clicking outside level editor but within an awakener card interaction area
    // should commit level edits without also toggling ownership.
    event.preventDefault()
    event.stopPropagation()

    const swallowNextClick = (clickEvent: MouseEvent) => {
      const clickTarget = clickEvent.target
      if (!(clickTarget instanceof Node)) {
        return
      }
      if (!interactionFrame.contains(clickTarget)) {
        return
      }
      clickEvent.preventDefault()
      clickEvent.stopPropagation()
    }

    document.addEventListener('click', swallowNextClick, {capture: true, once: true})
  }

  function handleCollectionCardWheel(
    event: WheelEvent<HTMLElement>,
    kind: 'awakeners' | 'wheels',
    id: string,
    ownedLevel: number | null,
    awakenerName?: string,
  ) {
    if (!event.shiftKey || event.deltaY === 0 || ownedLevel === null) {
      return
    }

    const wheelDirection = event.deltaY < 0 ? 1 : -1
    const cardElement = event.currentTarget
    const hasActiveLevelEditor =
      cardElement.querySelector('.collection-awakener-level-editor') !== null
    if (kind === 'awakeners' && awakenerName && hasActiveLevelEditor) {
      event.preventDefault()
      const currentLevel = model.getAwakenerLevel(awakenerName)
      const nextLevel = Math.min(90, Math.max(1, currentLevel + wheelDirection))
      if (nextLevel !== currentLevel) {
        model.setAwakenerLevel(awakenerName, nextLevel)
      }
      return
    }

    const target = event.target
    if (target instanceof Element && target.closest('input, textarea, select')) {
      return
    }

    event.preventDefault()
    if (wheelDirection > 0) {
      model.increaseLevel(kind, id)
      return
    }
    model.decreaseLevel(kind, id)
  }

  function handleSaveToFile() {
    const rawSnapshot = model.exportOwnershipSnapshot()
    const filename = `skeydb-collection-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([rawSnapshot], {type: 'application/json;charset=utf-8'})
    const objectUrl = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(objectUrl)

    showToast(`Saved ${filename}`)
  }

  function handleOpenLoadFilePicker() {
    importFileInputRef.current?.click()
  }

  async function handleLoadFromFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const rawSnapshot = await file.text()
      const parsed = model.importOwnershipSnapshot(rawSnapshot)
      if (!parsed.ok) {
        showToast(getCollectionLoadErrorMessage(parsed.error))
      } else {
        showToast(`Loaded ${file.name}`)
      }
    } catch {
      showToast('Load failed: could not read file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className='space-y-3'>
      <CollectionPageToolbar
        importFileInputRef={importFileInputRef}
        model={model}
        onLoadFromFile={handleLoadFromFile}
        onOpenLoadFilePicker={handleOpenLoadFilePicker}
        onSaveToFile={handleSaveToFile}
        onStatusMessage={showToast}
        ownedAwakenersForBoxExport={ownedAwakenersForBoxExport}
        ownedWheelsForBoxExport={ownedWheelsForBoxExport}
      />

      <div className='grid items-start gap-4 lg:grid-cols-[280px_1fr]'>
        <CollectionPageSidebar model={model} searchInputRef={searchInputRef} />

        <CollectionPageResults
          model={model}
          onCollectionCardWheel={handleCollectionCardWheel}
          onSwallowOutsideLevelClickIfCardInteraction={swallowOutsideLevelClickIfCardInteraction}
        />
      </div>
      <Toast
        className='pointer-events-none fixed right-4 bottom-4 z-[950] border border-amber-200/50 bg-slate-950/92 px-3 py-2 text-sm text-amber-100 shadow-[0_6px_20px_rgba(2,6,23,0.55)]'
        containerClassName='pointer-events-none fixed right-4 bottom-4 z-[950] flex flex-col items-end gap-2'
        entries={toastEntries}
      />
    </section>
  )
}
