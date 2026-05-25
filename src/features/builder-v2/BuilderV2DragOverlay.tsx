import {DragOverlay} from '@dnd-kit/core'

import type {BuilderV2DragPreviewDescriptor} from './builder-v2-dnd'

interface BuilderV2DragOverlayProps {
  isRemoveIntent?: boolean
  preview: BuilderV2DragPreviewDescriptor | null
}

export function BuilderV2DragOverlay({isRemoveIntent = false, preview}: BuilderV2DragOverlayProps) {
  return (
    <DragOverlay dropAnimation={null} wrapperElement='div' zIndex={1200}>
      {preview ? <BuilderV2DragPreview isRemoveIntent={isRemoveIntent} preview={preview} /> : null}
    </DragOverlay>
  )
}

function BuilderV2DragPreview({
  isRemoveIntent,
  preview,
}: {
  isRemoveIntent: boolean
  preview: BuilderV2DragPreviewDescriptor
}) {
  if (preview.variant === 'slot') {
    return <BuilderV2SlotDragPreview isRemoveIntent={isRemoveIntent} preview={preview} />
  }

  return (
    <div
      aria-label={preview.title}
      className={`builder-v2-drag-preview builder-v2-drag-preview--item ${
        isRemoveIntent ? 'builder-v2-drag-preview--remove-intent' : ''
      }`}
      data-kind={preview.kind}
    >
      {isRemoveIntent ? (
        <span aria-hidden className='builder-v2-drag-preview-remove-mark'>
          Remove
        </span>
      ) : null}
      <span className='builder-v2-drag-preview-art' aria-hidden>
        {preview.imageSrc ? (
          <img alt='' draggable={false} src={preview.imageSrc} />
        ) : (
          <span aria-hidden className='builder-v2-drag-preview-fallback'>
            {preview.title.slice(0, 1)}
          </span>
        )}
      </span>
      <span className='sr-only'>{preview.title}</span>
    </div>
  )
}

function BuilderV2SlotDragPreview({
  isRemoveIntent,
  preview,
}: {
  isRemoveIntent: boolean
  preview: BuilderV2DragPreviewDescriptor
}) {
  return (
    <div
      className={`builder-v2-drag-preview builder-v2-drag-preview--slot ${
        isRemoveIntent ? 'builder-v2-drag-preview--remove-intent' : ''
      }`}
      data-kind={preview.kind}
    >
      <span className='builder-v2-drag-preview-slot-art'>
        {preview.imageSrc ? (
          <img alt='' draggable={false} src={preview.imageSrc} />
        ) : (
          <span aria-hidden className='builder-v2-drag-preview-fallback'>
            {preview.title.slice(0, 1)}
          </span>
        )}
      </span>
      <span className='builder-v2-drag-preview-slot-meta'>
        {preview.subtitle ? (
          <span className='builder-v2-drag-preview-subtitle'>{preview.subtitle}</span>
        ) : null}
        <span className='builder-v2-drag-preview-title'>{preview.title}</span>
      </span>
    </div>
  )
}
