import {DragOverlay} from '@dnd-kit/core'
import {createPortal} from 'react-dom'

import type {
  BuilderV2DragPreviewDescriptor,
  BuilderV2TeamDragPreviewDescriptor,
} from './builder-v2-dnd'
import {TeamManagementDragPreview} from './BuilderV2TeamManagement'

interface BuilderV2DragOverlayProps {
  isRemoveIntent?: boolean
  preview: BuilderV2DragPreviewDescriptor | null
  teamPreview?: BuilderV2TeamDragPreviewDescriptor | null
}

export function BuilderV2DragOverlay({
  isRemoveIntent = false,
  preview,
  teamPreview = null,
}: BuilderV2DragOverlayProps) {
  const overlay = (
    <DragOverlay dropAnimation={null} wrapperElement='div' zIndex={1200}>
      {teamPreview ? (
        <TeamManagementDragPreview preview={teamPreview} />
      ) : preview ? (
        <BuilderV2DragPreview isRemoveIntent={isRemoveIntent} preview={preview} />
      ) : null}
    </DragOverlay>
  )

  return createPortal(overlay, document.body)
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
      aria-label={getBuilderV2DragPreviewAriaLabel(preview, isRemoveIntent)}
      className={`builder-v2-drag-preview builder-v2-drag-preview--item ${
        isRemoveIntent ? 'builder-v2-drag-preview--remove-intent' : ''
      }`}
      data-kind={preview.kind}
    >
      <span className='builder-v2-drag-preview-art' aria-hidden>
        {preview.imageSrc ? (
          <img alt='' draggable={false} src={preview.imageSrc} />
        ) : (
          <span aria-hidden className='builder-v2-drag-preview-fallback'>
            {preview.title.slice(0, 1)}
          </span>
        )}
      </span>
      <BuilderV2DragPreviewRemoveOverlay isVisible={isRemoveIntent} />
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
      aria-label={getBuilderV2DragPreviewAriaLabel(preview, isRemoveIntent)}
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
      <BuilderV2DragPreviewRemoveOverlay isVisible={isRemoveIntent} />
    </div>
  )
}

function BuilderV2DragPreviewRemoveOverlay({isVisible}: {isVisible: boolean}) {
  if (!isVisible) {
    return null
  }

  return (
    <span aria-hidden className='builder-v2-drag-preview-remove-overlay'>
      <span className='builder-v2-drag-preview-remove-icon' />
      <span className='builder-v2-drag-preview-remove-label'>Remove</span>
    </span>
  )
}

function getBuilderV2DragPreviewAriaLabel(
  preview: BuilderV2DragPreviewDescriptor,
  isRemoveIntent: boolean,
): string {
  return isRemoveIntent ? `${preview.title}, remove from team` : preview.title
}
