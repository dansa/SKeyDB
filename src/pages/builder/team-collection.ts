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

export type TeamTemplateId = 'DTIDE_5' | 'DTIDE_10'

type ApplyTeamTemplateResult = {
  nextTeams: Team[]
  createdCount: number
  renamedCount: number
  targetCount: number
  removedCount: number
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

function getTemplateNames(templateId: TeamTemplateId): string[] {
  if (templateId === 'DTIDE_5') {
    return ['Wave 1', 'Wave 2', 'Wave 3', 'Wave 4', 'Wave 5']
  }
  return [
    'Wave 1',
    'Wave 1 Extra',
    'Wave 2',
    'Wave 2 Extra',
    'Wave 3',
    'Wave 3 Extra',
    'Wave 4',
    'Wave 4 Extra',
    'Wave 5',
    'Wave 5 Extra',
  ]
}

export function isTeamEmpty(team: Team | undefined): boolean {
  if (!team) {
    return true
  }
  if (team.posseId) {
    return false
  }
  return team.slots.every(
    (slot) =>
      !slot.awakenerName &&
      !slot.faction &&
      !slot.level &&
      !slot.covenantId &&
      slot.wheels[0] === null &&
      slot.wheels[1] === null,
  )
}

export function resetTeam(currentTeams: Team[], teamId: string): Team[] {
  return currentTeams.map((team) =>
    team.id === teamId
      ? {
          ...team,
          posseId: undefined,
          slots: createEmptyTeamSlots(),
        }
      : team,
  )
}

export function applyTeamTemplate(currentTeams: Team[], templateId: TeamTemplateId): ApplyTeamTemplateResult {
  const templateNames = getTemplateNames(templateId)
  const targetCount = Math.min(templateNames.length, MAX_TEAMS)
  let nextTeams = [...currentTeams]
  const originalLength = nextTeams.length
  const neededTeams = Math.max(0, targetCount - originalLength)

  for (let index = originalLength; index < targetCount; index += 1) {
    nextTeams.push(createTeam(templateNames[index]))
  }

  let renamedCount = 0
  for (let index = 0; index < targetCount; index += 1) {
    const team = nextTeams[index]
    const nextName = templateNames[index]
    if (team.name === nextName) {
      continue
    }
    nextTeams[index] = { ...team, name: nextName }
    renamedCount += 1
  }

  let removedCount = 0
  if (templateId === 'DTIDE_5' && nextTeams.length > targetCount) {
    const kept = nextTeams.slice(0, targetCount)
    const tail = nextTeams.slice(targetCount)
    const retainedTail = tail.filter((team) => !isTeamEmpty(team))
    removedCount = tail.length - retainedTail.length
    nextTeams = [...kept, ...retainedTail]
  }

  if (neededTeams === 0 && renamedCount === 0 && removedCount === 0) {
    return { nextTeams: currentTeams, createdCount: 0, renamedCount: 0, removedCount: 0, targetCount }
  }

  return {
    nextTeams,
    createdCount: neededTeams,
    renamedCount,
    removedCount,
    targetCount,
  }
}
