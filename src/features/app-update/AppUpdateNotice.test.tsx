import {fireEvent, render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {AppUpdateNotice} from './AppUpdateNotice'

describe('AppUpdateNotice', () => {
  it('asks the user to refresh when a newer build is available', () => {
    const refresh = vi.fn()
    const dismiss = vi.fn()

    render(<AppUpdateNotice onDismiss={dismiss} onRefresh={refresh} />)

    expect(screen.getByRole('status')).toHaveTextContent(/new skeydb version/i)
    fireEvent.click(screen.getByRole('button', {name: /refresh/i}))

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(dismiss).not.toHaveBeenCalled()
  })
})
