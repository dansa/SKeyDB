import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ResponsiveDetailArt} from './ResponsiveDetailArt'

function ResponsiveArtworkFixture({isMobileViewport}: {isMobileViewport: boolean}) {
  return (
    <>
      <ResponsiveDetailArt isMobileViewport={isMobileViewport} viewport='desktop'>
        <img alt='Desktop artwork' src='/desktop.webp' />
      </ResponsiveDetailArt>
      <ResponsiveDetailArt isMobileViewport={isMobileViewport} viewport='mobile'>
        <img alt='Mobile artwork' src='/mobile.webp' />
      </ResponsiveDetailArt>
    </>
  )
}

describe('ResponsiveDetailArt', () => {
  it('mounts only desktop artwork for desktop viewports', () => {
    render(<ResponsiveArtworkFixture isMobileViewport={false} />)

    expect(screen.getByRole('img', {name: 'Desktop artwork'})).toBeInTheDocument()
    expect(screen.queryByRole('img', {name: 'Mobile artwork'})).not.toBeInTheDocument()
  })

  it('mounts only mobile artwork for mobile viewports', () => {
    render(<ResponsiveArtworkFixture isMobileViewport />)

    expect(screen.queryByRole('img', {name: 'Desktop artwork'})).not.toBeInTheDocument()
    expect(screen.getByRole('img', {name: 'Mobile artwork'})).toBeInTheDocument()
  })
})
