import React, {useRef, type ReactNode} from 'react'

import {decideTrailDirection, isTrailMobileLayout} from '../../utils/popover-trail'
import {usePopoverTrailDismiss, usePopoverTrailViewportVersion} from './popover-trail-panel-hooks'
import {DesktopPopoverTrailPanel, MobilePopoverTrailPanel} from './PopoverTrailPanelLayouts'

type PopoverTrailPanelProps = Readonly<{
  anchorRect: DOMRect
  anchorElement?: HTMLElement | null
  entryRects?: (DOMRect | undefined)[]
  itemCount: number
  onCloseTop: () => void
  children: ReactNode
}>

export function PopoverTrailPanel({
  anchorRect,
  anchorElement,
  entryRects,
  itemCount,
  onCloseTop,
  children,
}: PopoverTrailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  usePopoverTrailViewportVersion()
  usePopoverTrailDismiss(containerRef, onCloseTop)

  const isMobile = isTrailMobileLayout(globalThis.innerWidth)
  const currentAnchorRect = anchorElement?.isConnected
    ? anchorElement.getBoundingClientRect()
    : anchorRect
  const direction = isMobile
    ? 'down'
    : decideTrailDirection(currentAnchorRect, globalThis.innerHeight)
  const childArray = React.Children.toArray(children)

  if (isMobile) {
    return (
      <MobilePopoverTrailPanel
        children={childArray}
        containerRef={containerRef}
        itemCount={itemCount}
        onCloseTop={onCloseTop}
      />
    )
  }

  return (
    <DesktopPopoverTrailPanel
      children={childArray}
      containerRef={containerRef}
      currentAnchorRect={currentAnchorRect}
      direction={direction}
      entryRects={entryRects}
    />
  )
}
