import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {BuilderWideBar} from './BuilderWideBar'

describe('BuilderWideBar', () => {
  it('disables shared export actions when there are no teams or no active team', () => {
    render(
      <BuilderWideBar
        canUndoReset={false}
        hasActiveTeam={false}
        hasTeams={false}
        onExportAll={vi.fn()}
        onExportIngame={vi.fn()}
        onImport={vi.fn()}
        onRequestReset={vi.fn()}
        onUndoReset={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', {name: /Export All/i})).toBeDisabled()
    expect(screen.getByRole('button', {name: /Export In-Game/i})).toBeDisabled()
  })
})
