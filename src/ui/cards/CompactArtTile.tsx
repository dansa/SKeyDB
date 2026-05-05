import type {ReactNode} from 'react'

interface CompactArtTileProps {
  name: string
  nameTitle?: string
  preview: ReactNode
  actions?: ReactNode
  chips?: ReactNode
  actionPlacement?: 'overlay' | 'caption'
  chipPlacement?: 'top' | 'bottom' | 'caption' | 'overlay-stack'
  statusBar?: ReactNode
  overlay?: ReactNode
  containerClassName?: string
  previewClassName?: string
  nameClassName?: string
}

export function CompactArtTile({
  name,
  nameTitle,
  preview,
  actions,
  actionPlacement = 'overlay',
  chips,
  chipPlacement = 'top',
  statusBar,
  overlay,
  containerClassName = '',
  previewClassName = '',
  nameClassName = '',
}: CompactArtTileProps) {
  const topChips = chipPlacement === 'top' ? chips : undefined
  const bottomChips = chipPlacement === 'bottom' ? chips : undefined
  const captionChips = chipPlacement === 'caption' ? chips : undefined
  const overlayStackChips = chipPlacement === 'overlay-stack' ? chips : undefined
  const overlayActions = actionPlacement === 'overlay' ? actions : undefined
  const captionActions = actionPlacement === 'caption' ? actions : undefined
  const overlayStackStatusBar = chipPlacement === 'overlay-stack' ? statusBar : undefined
  const overlayStatusBar =
    chipPlacement === 'caption' || chipPlacement === 'overlay-stack' ? undefined : statusBar
  const captionStatusBar = chipPlacement === 'caption' ? statusBar : undefined
  const hasCaptionSignals = Boolean(captionStatusBar) || Boolean(captionChips)
  const hasOverlayStack = Boolean(overlayStackStatusBar) || Boolean(overlayStackChips)
  const hasTopChrome = Boolean(overlayStatusBar) || Boolean(topChips) || Boolean(overlayActions)
  const hasOverlayChrome = hasTopChrome || hasOverlayStack || Boolean(bottomChips)

  return (
    <div className={`compact-art-tile flex w-full min-w-0 flex-col ${containerClassName}`.trim()}>
      <div
        className={`compact-art-tile-preview relative w-full overflow-hidden ${previewClassName}`.trim()}
      >
        {preview}
        {overlay ?? null}
        {hasOverlayChrome ? (
          <div className='compact-art-tile-overlay-chrome pointer-events-none absolute inset-1 z-40 flex flex-col justify-between gap-1'>
            <div className='compact-art-tile-top-row flex min-h-4 items-start gap-1'>
              {hasOverlayStack ? (
                <div
                  className={`compact-art-tile-signal-stack flex min-w-0 flex-col items-start gap-0.5 ${
                    overlayActions ? 'compact-art-tile-top-signals-with-actions' : ''
                  }`.trim()}
                >
                  {overlayStackStatusBar ?? null}
                  {overlayStackChips ? (
                    <span className='compact-art-tile-chip-row compact-art-tile-chip-row-overlay-stack flex min-w-0 flex-col items-start gap-0.5'>
                      {overlayStackChips}
                    </span>
                  ) : null}
                </div>
              ) : overlayStatusBar || topChips ? (
                <div
                  className={`compact-art-tile-top-signals flex min-w-0 flex-wrap gap-1 ${
                    overlayActions ? 'compact-art-tile-top-signals-with-actions' : ''
                  }`.trim()}
                >
                  {overlayStatusBar ?? null}
                  {topChips ? (
                    <span className='compact-art-tile-chip-row compact-art-tile-chip-row-top flex min-w-0 flex-wrap gap-1'>
                      {topChips}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {overlayActions ? (
                <div className='compact-art-tile-action-row pointer-events-auto ml-auto flex shrink-0 gap-1'>
                  {overlayActions}
                </div>
              ) : null}
            </div>
            {bottomChips ? (
              <div className='compact-art-tile-chip-row compact-art-tile-chip-row-bottom flex min-w-0 flex-wrap items-end gap-1'>
                {bottomChips}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className='compact-art-tile-caption mt-1 min-w-0'>
        {hasCaptionSignals ? (
          <div className='compact-art-tile-caption-signals mb-0.5 flex min-w-0 items-center gap-1 overflow-hidden'>
            {captionStatusBar ?? null}
            {captionChips ? (
              <span className='compact-art-tile-chip-row compact-art-tile-chip-row-caption flex min-w-0 items-center gap-1 overflow-hidden'>
                {captionChips}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className='compact-art-tile-name-row flex min-w-0 items-center gap-1'>
          <p
            className={`compact-art-tile-name min-w-0 flex-1 text-[11px] text-slate-200 ${nameClassName}`.trim()}
            title={nameTitle}
          >
            {name}
          </p>
          {captionActions ? (
            <div className='compact-art-tile-caption-action-row pointer-events-auto relative z-40 flex shrink-0'>
              {captionActions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
