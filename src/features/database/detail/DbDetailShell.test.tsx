import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import {buildPublicFormulaContext} from '@/domain/public-formula-context'
import {useDatabaseDetailPreferences} from '@/features/database/internal/useDatabaseDetailPreferences'
import {useDatabasePopoverController} from '@/features/database/internal/useDatabasePopoverController'

import {DbDetailShell} from './DbDetailShell'

function buildReferenceLayer(): ResolvedDatabaseReferenceLayer {
  return {
    accessibleOverlays: [],
    cardNames: new Set<string>(),
    overlayByName: new Map(),
    referenceInfoById: new Map(),
    referenceInfoByName: new Map(),
  }
}

function TestShell({onClose}: {onClose: () => void}) {
  const {preferences, updateSharedPreferences} = useDatabaseDetailPreferences()
  const formulaContext = buildPublicFormulaContext({accountLevel: preferences.shared.accountLevel})
  const popoverController = useDatabasePopoverController({
    formulaContext,
    referenceLayer: buildReferenceLayer(),
    showTagIcons: preferences.shared.showTagIcons,
  })

  return (
    <DbDetailShell
      artAsset='/artifact-full.webp'
      fullArtAlt='Test Artifact full art'
      itemName='Test Artifact'
      kindLabel='artifact'
      onClose={onClose}
      popoverController={popoverController}
      preferences={preferences}
      updateSharedPreferences={updateSharedPreferences}
    >
      <div>Simple artifact body</div>
    </DbDetailShell>
  )
}

describe('DbDetailShell', () => {
  it('dismisses settings before closing on Escape and closes from outside clicks', () => {
    const onClose = vi.fn()

    const {container} = render(<TestShell onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', {name: 'Open detail settings'}))
    expect(screen.getByRole('spinbutton', {name: 'Account level'})).toBeInTheDocument()

    fireEvent.keyDown(window, {key: 'Escape'})
    expect(screen.queryByRole('spinbutton', {name: 'Account level'})).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.keyDown(window, {key: 'Escape'})
    expect(onClose).toHaveBeenCalledTimes(1)

    onClose.mockClear()
    const shellElement = container.firstElementChild
    expect(shellElement).not.toBeNull()
    if (shellElement === null) {
      throw new Error('Expected shell root element')
    }
    fireEvent.click(shellElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('opens and closes the simple artifact full art viewer', () => {
    render(<TestShell onClose={vi.fn()} />)

    fireEvent.click(screen.getAllByRole('button', {name: /view full art for test artifact/i})[0])

    expect(screen.getByRole('dialog', {name: /test artifact full art/i})).toBeInTheDocument()
    expect(screen.getByRole('img', {name: /test artifact full art/i})).toHaveAttribute(
      'src',
      '/artifact-full.webp',
    )

    fireEvent.click(screen.getByRole('dialog', {name: /test artifact full art/i}))

    expect(screen.queryByRole('dialog', {name: /test artifact full art/i})).not.toBeInTheDocument()
  })
})
