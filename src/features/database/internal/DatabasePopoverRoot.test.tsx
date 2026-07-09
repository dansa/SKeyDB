import {useEffect} from 'react'

import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {DatabasePopoverRoot, type DatabasePopoverRootProps} from './DatabasePopoverRoot'
import {PopoverProvider, usePopoverStore} from './usePopoverStore'

vi.mock('./DatabasePopoverPortal', () => ({
  DatabasePopoverPortal: () => <div data-testid='database-popover-portal' />,
}))

function TestRootWrapper({anchor}: {anchor: HTMLElement}) {
  return (
    <PopoverProvider>
      <TestRootWrapperInner anchor={anchor} />
    </PopoverProvider>
  )
}

function TestRootWrapperInner({anchor}: {anchor: HTMLElement}) {
  const openRoot = usePopoverStore((state) => state.openRoot)
  useEffect(() => {
    openRoot('owner', {
      key: 'entry',
      referenceId: 'id',
      name: 'name',
      label: 'label',
      description: 'desc',
    })
  }, [openRoot])

  return <DatabasePopoverRoot {...makeRootProps(anchor)} />
}

function makeRootProps(anchorElement: HTMLElement): DatabasePopoverRootProps {
  return {
    anchorElement,
    anchorRect: new DOMRect(10, 10, 20, 20),
    onCloseAll: vi.fn(),
    referenceLayer: null,
    stats: {} as DatabasePopoverRootProps['stats'],
    nestedActions: {
      openNestedInfoFrom: vi.fn(),
      openNestedOverlayFrom: vi.fn(),
      openNestedReferenceByNameFrom: vi.fn(),
    },
    closeTrailFrom: vi.fn(),
  }
}

describe('DatabasePopoverRoot', () => {
  it('mounts popovers inside the active detail modal shell when the anchor belongs to it', async () => {
    const modalDialog = document.createElement('dialog')
    modalDialog.dataset.detailModalOverlay = ''
    const modalShell = document.createElement('div')
    modalShell.dataset.detailModalShell = ''
    const anchor = document.createElement('button')
    modalShell.append(anchor)
    modalDialog.append(modalShell)
    document.body.append(modalDialog)

    render(<TestRootWrapper anchor={anchor} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.closest('[data-detail-modal-shell]')).toBe(modalShell)

    modalDialog.remove()
  })

  it('falls back to the active detail modal overlay when no shell owns the anchor', async () => {
    const modalDialog = document.createElement('dialog')
    modalDialog.dataset.detailModalOverlay = ''
    const anchor = document.createElement('button')
    modalDialog.append(anchor)
    document.body.append(modalDialog)

    render(<TestRootWrapper anchor={anchor} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.closest('[data-detail-modal-overlay]')).toBe(modalDialog)

    modalDialog.remove()
  })

  it('mounts page popovers on the document body when no modal owns the anchor', async () => {
    const anchor = document.createElement('button')
    document.body.append(anchor)

    render(<TestRootWrapper anchor={anchor} />)

    const portal = await screen.findByTestId('database-popover-portal')
    expect(portal.parentElement).toBe(document.body)

    anchor.remove()
  })
})
