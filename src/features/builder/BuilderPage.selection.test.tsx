import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import './builder-page.integration-mocks'
import {BuilderPage} from './BuilderPage'

describe('BuilderPage selection behavior', () => {
  it('exposes selected awakener and posse realm filters', () => {
    render(<BuilderPage />)
    expect(screen.getByRole('button', {name: 'All', pressed: true})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Aequor', pressed: false}))
    expect(screen.getByRole('button', {name: 'Aequor', pressed: true})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', {name: 'Posses'}))
    expect(screen.getByRole('button', {name: 'All', pressed: true})).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', {name: 'Aequor', pressed: false}))
    expect(screen.getByRole('button', {name: 'Aequor', pressed: true})).toBeInTheDocument()
  })

  it('clears active selection when clicking outside picker zone', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    expect(screen.getByRole('button', {name: /remove active awakener/i})).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', {name: /import/i}))
    expect(screen.queryByRole('button', {name: /remove active awakener/i})).not.toBeInTheDocument()
  })

  it('clears active selection when clicking completely outside builder section', () => {
    render(
      <div>
        <button type='button'>Outside Click Target</button>
        <BuilderPage />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', {name: /goliath/i}))
    fireEvent.click(screen.getByRole('button', {name: /change goliath/i}))
    expect(screen.getByRole('button', {name: /remove active awakener/i})).toBeInTheDocument()

    fireEvent.pointerDown(screen.getByRole('button', {name: /outside click target/i}))
    expect(screen.queryByRole('button', {name: /remove active awakener/i})).not.toBeInTheDocument()
  })
})
