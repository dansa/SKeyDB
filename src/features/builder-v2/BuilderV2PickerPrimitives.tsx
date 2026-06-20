import {type ButtonHTMLAttributes, type CSSProperties, type ReactNode} from 'react'

import {useDraggable} from '@dnd-kit/core'
import {FaCaretDown, FaCaretUp, FaCircleInfo} from 'react-icons/fa6'

import type {CollectionSortDirection} from '@/domain/collection-sorting'
import {getRealmAccent} from '@/domain/realms'

import type {BuilderV2DragPayload} from './builder-v2-dnd'

interface BuilderV2PickerTileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  dndId: string
  dndData?: BuilderV2DragPayload
  isDndEnabled: boolean
}

export function BuilderV2PickerTileFrame({
  children,
  detailLabel,
  onOpenDetail,
  tileKind,
}: {
  children: ReactNode
  detailLabel: string
  onOpenDetail: () => void
  tileKind?: 'wheel'
}) {
  return (
    <div
      className={`builder-v2-picker-tile-frame ${
        tileKind === 'wheel' ? 'builder-v2-picker-tile-frame--wheel' : ''
      }`}
    >
      {children}
      <button
        aria-label={detailLabel}
        className='builder-v2-picker-detail-button'
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpenDetail()
        }}
        title={detailLabel}
        type='button'
      >
        <FaCircleInfo aria-hidden />
      </button>
    </div>
  )
}

export function BuilderV2PickerTileButton({
  children,
  dndId,
  dndData,
  isDndEnabled,
  ...buttonProps
}: BuilderV2PickerTileButtonProps) {
  if (isDndEnabled && dndData) {
    return (
      <BuilderV2DraggablePickerTileButton dndData={dndData} dndId={dndId} {...buttonProps}>
        {children}
      </BuilderV2DraggablePickerTileButton>
    )
  }

  return (
    <button type='button' {...buttonProps}>
      {children}
    </button>
  )
}

function BuilderV2DraggablePickerTileButton({
  children,
  dndData,
  dndId,
  ...buttonProps
}: Omit<BuilderV2PickerTileButtonProps, 'isDndEnabled'> & {dndData: BuilderV2DragPayload}) {
  const {listeners, setNodeRef} = useDraggable({
    id: dndId,
    data: dndData,
  })

  return (
    <button ref={setNodeRef} type='button' {...buttonProps} {...listeners}>
      {children}
    </button>
  )
}

export function BuilderV2PickerTileArt({
  alt,
  chips,
  fallback,
  footer,
  isDimmed = false,
  realm,
  src,
}: {
  alt: string
  chips?: ReactNode
  fallback: string
  footer?: ReactNode
  isDimmed?: boolean
  realm?: string
  src: string | undefined
}) {
  const realmAccent = realm ? getRealmAccent(realm) : undefined
  return (
    <span
      className='builder-v2-picker-tile-art'
      style={realmAccent ? ({'--picker-realm-accent': realmAccent} as CSSProperties) : undefined}
    >
      {src ? (
        <img
          alt={alt}
          className={
            isDimmed
              ? 'builder-v2-picker-tile-image builder-v2-picker-tile-image--dimmed'
              : 'builder-v2-picker-tile-image'
          }
          decoding='async'
          draggable={false}
          fetchPriority='low'
          loading='lazy'
          src={src}
        />
      ) : (
        <span className='builder-v2-picker-tile-fallback'>{fallback.slice(0, 1)}</span>
      )}
      {chips || footer ? (
        <span className='builder-v2-picker-tile-overlay' aria-hidden={false}>
          <span className='builder-v2-picker-tile-chips'>{chips}</span>
          <span className='builder-v2-picker-tile-footer'>{footer}</span>
        </span>
      ) : null}
    </span>
  )
}

export function BuilderV2PickerTileCaption({title}: {title: string}) {
  return (
    <span className='builder-v2-picker-tile-caption'>
      <span className='builder-v2-picker-tile-name' title={title}>
        {title}
      </span>
    </span>
  )
}

export function BuilderV2PickerStateChip({
  children,
  tone,
}: {
  children: ReactNode
  tone: 'danger' | 'quiet' | 'recommendation' | 'status'
}) {
  return (
    <span className='builder-v2-picker-state-chip' data-tone={tone}>
      {children}
    </span>
  )
}

export function BuilderV2PickerChipRow({children, label}: {children: ReactNode; label: string}) {
  return (
    <div className='builder-v2-picker-chips' aria-label={label}>
      {children}
    </div>
  )
}

export function BuilderV2PickerChip({
  ariaLabel,
  iconSrc,
  isActive,
  label,
  onClick,
}: {
  ariaLabel?: string
  iconSrc?: string
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={`builder-v2-picker-chip ${iconSrc ? 'builder-v2-picker-chip--icon' : ''} ${
        isActive ? 'builder-v2-picker-chip--active' : ''
      }`}
      onClick={onClick}
      type='button'
    >
      {iconSrc ? <img alt='' draggable={false} src={iconSrc} /> : null}
      <span className={iconSrc ? 'sr-only' : undefined}>{label}</span>
    </button>
  )
}

export function BuilderV2PickerSortRow({
  direction,
  label,
  onDirectionToggle,
  select,
}: {
  direction: CollectionSortDirection
  label: string
  onDirectionToggle: () => void
  select: ReactNode
}) {
  const directionLabel = direction === 'DESC' ? 'High to low' : 'Low to high'

  return (
    <div className='builder-v2-picker-field builder-v2-picker-sort-row'>
      <span>{label}</span>
      <div className='builder-v2-picker-sort-control'>
        {select}
        <button
          aria-label={`Toggle sort direction, currently ${directionLabel}`}
          className='builder-v2-picker-sort-direction'
          onClick={onDirectionToggle}
          title={directionLabel}
          type='button'
        >
          {direction === 'DESC' ? (
            <FaCaretDown aria-hidden className='builder-v2-picker-sort-direction-icon' />
          ) : (
            <FaCaretUp aria-hidden className='builder-v2-picker-sort-direction-icon' />
          )}
        </button>
      </div>
    </div>
  )
}

export function BuilderV2PickerToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className='builder-v2-picker-toggle'>
      <span>{label}</span>
      <input
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
        type='checkbox'
      />
    </label>
  )
}
