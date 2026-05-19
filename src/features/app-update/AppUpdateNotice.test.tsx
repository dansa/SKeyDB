import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AppUpdateNotice} from './AppUpdateNotice'

describe('AppUpdateNotice', () => {
  it('asks the user to refresh when a newer build is available', () => {
    const refresh = vi.fn()
    const dismiss = vi.fn()

    render(<AppUpdateNotice onDismiss={dismiss} onRefresh={refresh} reason='version' />)

    expect(screen.getByRole('status')).toHaveTextContent(/new skeydb version/i)
    fireEvent.click(screen.getByRole('button', {name: /refresh/i}))

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(dismiss).not.toHaveBeenCalled()
  })

  it('uses stronger copy when the current page already failed to load a chunk', () => {
    render(
      <AppUpdateNotice
        onDismiss={() => undefined}
        onRefresh={() => undefined}
        reason='chunk-load'
      />,
    )

    expect(screen.getByRole('status')).toHaveTextContent(/could not finish loading/i)
    expect(screen.queryByRole('button', {name: /not now/i})).not.toBeInTheDocument()
  })
})
