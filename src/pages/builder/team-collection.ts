import { createEmptyTeamSlots } from './constants'
import type { Team } from './types'

export const MAX_TEAMS = 10

type AddTeamResult = {
  nextTeams: Team[]
  addedTeamId?: string
}

type DeleteTeamResult = {
  nextTeams: Team[]
  nextActiveTeamId: string
}

function getHighestTeamNumber(teams: Team[]) {
  return teams.reduce((maxValue, team) => {
    const match = team.name.match(/^Team\s+(\d+)$/i)
    if (!match) {
      return maxValue
    }
    const parsed = Number.parseInt(match[1], 10)
    return Number.isFinite(parsed) ? Math.max(maxValue, parsed) : maxValue
  }, 0)
}

function createTeam(name: string): Team {
  return {
    id: `team-${crypto.randomUUID()}`,
    name,
    slots: createEmptyTeamSlots(),
  }
}

export function createInitialTeams(): Team[] {
  return [createTeam('Team 1')]
}

export function addTeam(currentTeams: Team[]): AddTeamResult {
  if (currentTeams.length >= MAX_TEAMS) {
    return { nextTeams: currentTeams }
  }

  const nextTeamNumber = getHighestTeamNumber(currentTeams) + 1
  const nextTeam = createTeam(`Team ${nextTeamNumber}`)
  return {
    nextTeams: [...currentTeams, nextTeam],
    addedTeamId: nextTeam.id,
  }
}

export function renameTeam(currentTeams: Team[], teamId: string, nextName: string): Team[] {
  const trimmedName = nextName.trim()
  if (!trimmedName) {
    return currentTeams
  }
  return currentTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          name: trimmedName,
        }
      : team,
  )
}

export function deleteTeam(currentTeams: Team[], teamId: string, activeTeamId: string): DeleteTeamResult {
  if (currentTeams.length <= 1) {
    return {
      nextTeams: currentTeams,
      nextActiveTeamId: activeTeamId,
    }
  }

  const nextTeams = currentTeams.filter((team) => team.id !== teamId)
  if (nextTeams.length === currentTeams.length) {
    return {
      nextTeams: currentTeams,
      nextActiveTeamId: activeTeamId,
    }
  }

  const nextActiveTeamId = activeTeamId === teamId ? nextTeams[0].id : activeTeamId
  return {
    nextTeams,
    nextActiveTeamId,
  }
}

export function reorderTeams(currentTeams: Team[], sourceTeamId: string, targetTeamId: string): Team[] {
  if (sourceTeamId === targetTeamId) {
    return currentTeams
  }

  const sourceIndex = currentTeams.findIndex((team) => team.id === sourceTeamId)
  const targetIndex = currentTeams.findIndex((team) => team.id === targetTeamId)
  if (sourceIndex === -1 || targetIndex === -1) {
    return currentTeams
  }

  const nextTeams = [...currentTeams]
  const [movedTeam] = nextTeams.splice(sourceIndex, 1)
  nextTeams.splice(targetIndex, 0, movedTeam)
  return nextTeams
}
