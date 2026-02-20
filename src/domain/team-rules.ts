export type TeamMember = {
  awakenerId: string
  faction: string
  wheelIds: string[]
}

export type TeamPlan = {
  id: string
  posseId?: string
  members: TeamMember[]
}

export type RuleViolationCode =
  | 'TEAM_COUNT_EXCEEDED'
  | 'TOO_MANY_FACTIONS_IN_TEAM'
  | 'DUPLICATE_AWAKENER'
  | 'DUPLICATE_WHEEL'
  | 'DUPLICATE_POSSE'

export type RuleViolation = {
  code: RuleViolationCode
  message: string
  teamId?: string
  value?: string
}

export type TeamRulesConfig = {
  maxTeams: number
  maxFactionsPerTeam: number
}

export const DEFAULT_TEAM_RULES_CONFIG: TeamRulesConfig = {
  maxTeams: 10,
  maxFactionsPerTeam: 2,
}

export function getDistinctFactionsForTeam(
  members: Array<Pick<TeamMember, 'faction'>>,
): Set<string> {
  return new Set(members.map((member) => member.faction.trim().toUpperCase()).filter(Boolean))
}

export function exceedsFactionLimitForTeam(
  members: Array<Pick<TeamMember, 'faction'>>,
  maxFactionsPerTeam: number,
): boolean {
  return getDistinctFactionsForTeam(members).size > maxFactionsPerTeam
}

export function validateTeamPlan(
  teamPlan: TeamPlan[],
  config: Partial<TeamRulesConfig> = {},
): { isValid: boolean; violations: RuleViolation[] } {
  const settings = { ...DEFAULT_TEAM_RULES_CONFIG, ...config }
  const violations: RuleViolation[] = []

  if (teamPlan.length > settings.maxTeams) {
    violations.push({
      code: 'TEAM_COUNT_EXCEEDED',
      message: `A maximum of ${settings.maxTeams} teams is allowed.`,
    })
  }

  const seenAwakeners = new Set<string>()
  const seenWheels = new Set<string>()
  const seenPosses = new Set<string>()

  for (const team of teamPlan) {
    if (team.posseId) {
      if (seenPosses.has(team.posseId)) {
        violations.push({
          code: 'DUPLICATE_POSSE',
          message: `Posse ${team.posseId} is used more than once across teams.`,
          teamId: team.id,
          value: team.posseId,
        })
      } else {
        seenPosses.add(team.posseId)
      }
    }

    const factionsInTeam = getDistinctFactionsForTeam(team.members)
    if (factionsInTeam.size > settings.maxFactionsPerTeam) {
      violations.push({
        code: 'TOO_MANY_FACTIONS_IN_TEAM',
        message: `Team ${team.id} has ${factionsInTeam.size} factions, max is ${settings.maxFactionsPerTeam}.`,
        teamId: team.id,
      })
    }

    for (const member of team.members) {
      if (seenAwakeners.has(member.awakenerId)) {
        violations.push({
          code: 'DUPLICATE_AWAKENER',
          message: `Awakener ${member.awakenerId} is used more than once across teams.`,
          teamId: team.id,
          value: member.awakenerId,
        })
      } else {
        seenAwakeners.add(member.awakenerId)
      }

      for (const wheelId of member.wheelIds) {
        if (seenWheels.has(wheelId)) {
          violations.push({
            code: 'DUPLICATE_WHEEL',
            message: `Wheel ${wheelId} is used more than once across teams.`,
            teamId: team.id,
            value: wheelId,
          })
        } else {
          seenWheels.add(wheelId)
        }
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  }
}
