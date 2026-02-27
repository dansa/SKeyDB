import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import './builder-page.integration-mocks'
import { BuilderPage } from './BuilderPage'
import { encodeMultiTeamCode, encodeSingleTeamCode } from '../domain/import-export'
import type { Team } from './builder/types'

function makeImportTeam(name: string, awakenerName: string): Team {
  return {
    id: `${name}-id`,
    name,
    slots: [
      { slotId: 'slot-1', awakenerName, faction: 'AEQUOR', level: 60, wheels: [null, null] },
      { slotId: 'slot-2', wheels: [null, null] },
      { slotId: 'slot-3', wheels: [null, null] },
      { slotId: 'slot-4', wheels: [null, null] },
    ],
  }
}

describe('BuilderPage import-export', () => {
  it('exports and imports a single team using t1 code', () => {
    render(<BuilderPage />)

    const t1Code = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))

    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    expect(within(importDialog).getByText(/in-game `@@\.\.\.@@` import is work in progress/i)).toBeInTheDocument()
    fireEvent.change(within(importDialog).getByRole('textbox', { name: /import code/i }), {
      target: { value: t1Code },
    })
    fireEvent.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.getByText(/team imported/i)).toBeInTheDocument()
  })

  it('submits import dialog on Enter key', () => {
    render(<BuilderPage />)

    const t1Code = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))

    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    const importInput = within(importDialog).getByRole('textbox', { name: /import code/i })
    fireEvent.change(importInput, { target: { value: t1Code } })
    fireEvent.keyDown(importInput, { key: 'Enter', code: 'Enter' })

    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.getByText(/team imported/i)).toBeInTheDocument()
  })

  it('imports mt1 code after replace confirmation', () => {
    const teamA = makeImportTeam('Alpha', 'goliath')
    const teamB = makeImportTeam('Beta', 'ramona')
    const mtCode = encodeMultiTeamCode([teamA, teamB], teamB.id)
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    fireEvent.change(within(importDialog).getByRole('textbox', { name: /import code/i }), {
      target: { value: mtCode },
    })
    fireEvent.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(screen.getByRole('dialog', { name: /replace current teams/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^replace$/i }))

    expect(container.querySelector('[data-team-name="Team 1"]')).not.toBeNull()
    expect(container.querySelector('[data-team-name="Team 2"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: /change ramona/i })).toBeInTheDocument()
  })

  it('imports t1 into active team when active team is empty', () => {
    const t1Code = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))
    const { container } = render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /\+ add team/i }))
    const team2Row = container.querySelector('[data-team-name="Team 2"]')
    expect(team2Row).not.toBeNull()
    fireEvent.click(within(team2Row as HTMLElement).getByText('Team 2'))

    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    fireEvent.change(within(importDialog).getByRole('textbox', { name: /import code/i }), {
      target: { value: t1Code },
    })
    fireEvent.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(container.querySelector('[data-team-name="Team 3"]')).toBeNull()
    expect(screen.getByRole('button', { name: /change goliath/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rename team 2/i })).toBeInTheDocument()
  })

  it('exports active team in in-game @@ format', () => {
    render(<BuilderPage />)

    const goliathCode = encodeSingleTeamCode(makeImportTeam('Imported Team', 'goliath'))
    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    fireEvent.change(within(importDialog).getByRole('textbox', { name: /import code/i }), {
      target: { value: goliathCode },
    })
    fireEvent.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    fireEvent.click(screen.getByRole('button', { name: /export in-game/i }))
    const exportDialog = screen.getByRole('dialog', { name: /export in-game/i })
    expect(within(exportDialog).getByText(/in-game export is work in progress/i)).toBeInTheDocument()
    const codeArea = within(exportDialog).getByRole('textbox', { name: /export code/i }) as HTMLTextAreaElement
    expect(codeArea.value.startsWith('@@')).toBe(true)
    expect(codeArea.value.endsWith('@@')).toBe(true)
  })

  it('shows unsupported token warning toast for in-game awakener/wheel imports', () => {
    render(<BuilderPage />)

    fireEvent.click(screen.getByRole('button', { name: /import/i }))
    const importDialog = screen.getByRole('dialog', { name: /import teams/i })
    fireEvent.change(within(importDialog).getByRole('textbox', { name: /import code/i }), {
      target: { value: '@@#aaaaaaaaaaaa@@' },
    })
    fireEvent.click(within(importDialog).getByRole('button', { name: /^import$/i }))

    expect(screen.getByText(/unsupported awakener\/wheel tokens imported as empty/i)).toBeInTheDocument()
  })
})
