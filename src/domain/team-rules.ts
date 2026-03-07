export interface TeamMember {
  awakenerId: string
  realm: string
  wheelIds: string[]
  isSupport?: boolean
}

export interface TeamPlan {
  id: string
  posseId?: string
  members: TeamMember[]
}

export type RuleViolationCode =
  | 'TEAM_COUNT_EXCEEDED'
  | 'TOO_MANY_REALMS_IN_TEAM'
  | 'DUPLICATE_AWAKENER'
  | 'DUPLICATE_WHEEL'
  | 'DUPLICATE_POSSE'
  | 'MULTIPLE_SUPPORT_AWAKENERS'

export interface RuleViolation {
  code: RuleViolationCode
  message: string
  teamId?: string
  value?: string
}

export interface TeamRulesConfig {
  maxTeams: number
  maxRealmsPerTeam: number
  enforceUniqueAwakeners: boolean
  enforceUniqueWheels: boolean
  enforceUniquePosses: boolean
}

interface SharedSeenState {
  awakeners: Set<string>
  wheels: Set<string>
  posses: Set<string>
}

interface TeamSeenState {
  awakeners: Set<string>
  wheels: Set<string>
}

export const DEFAULT_TEAM_RULES_CONFIG: TeamRulesConfig = {
  maxTeams: 10,
  maxRealmsPerTeam: 2,
  enforceUniqueAwakeners: true,
  enforceUniqueWheels: true,
  enforceUniquePosses: true,
}

export function getDistinctRealmsForTeam(members: Pick<TeamMember, 'realm'>[]): Set<string> {
  return new Set(members.map((member) => member.realm.trim().toUpperCase()).filter(Boolean))
}

export function exceedsRealmLimitForTeam(
  members: Pick<TeamMember, 'realm'>[],
  maxRealmsPerTeam: number,
): boolean {
  return getDistinctRealmsForTeam(members).size > maxRealmsPerTeam
}

function pushTeamCountViolation(violations: RuleViolation[], maxTeams: number) {
  violations.push({
    code: 'TEAM_COUNT_EXCEEDED',
    message: `A maximum of ${String(maxTeams)} teams is allowed.`,
  })
}

function validateTeamPosse(
  team: TeamPlan,
  settings: TeamRulesConfig,
  seen: SharedSeenState,
  violations: RuleViolation[],
) {
  if (!team.posseId) {
    return
  }

  if (settings.enforceUniquePosses && seen.posses.has(team.posseId)) {
    violations.push({
      code: 'DUPLICATE_POSSE',
      message: `Posse ${team.posseId} is used more than once across teams.`,
      teamId: team.id,
      value: team.posseId,
    })
    return
  }

  seen.posses.add(team.posseId)
}

function validateTeamRealmLimit(
  team: TeamPlan,
  settings: TeamRulesConfig,
  violations: RuleViolation[],
) {
  const realmsInTeam = getDistinctRealmsForTeam(team.members)
  if (realmsInTeam.size <= settings.maxRealmsPerTeam) {
    return
  }

  violations.push({
    code: 'TOO_MANY_REALMS_IN_TEAM',
    message: `Team ${team.id} has ${String(realmsInTeam.size)} realms, max is ${String(settings.maxRealmsPerTeam)}.`,
    teamId: team.id,
  })
}

function validateMemberAwakener(
  member: TeamMember,
  teamId: string,
  settings: TeamRulesConfig,
  sharedSeen: SharedSeenState,
  teamSeen: TeamSeenState,
  violations: RuleViolation[],
) {
  if (!settings.enforceUniqueAwakeners) {
    return
  }

  if (teamSeen.awakeners.has(member.awakenerId)) {
    violations.push({
      code: 'DUPLICATE_AWAKENER',
      message: `Awakener ${member.awakenerId} is used more than once in team ${teamId}.`,
      teamId,
      value: member.awakenerId,
    })
    return
  }

  if (!member.isSupport && sharedSeen.awakeners.has(member.awakenerId)) {
    violations.push({
      code: 'DUPLICATE_AWAKENER',
      message: `Awakener ${member.awakenerId} is used more than once across teams.`,
      teamId,
      value: member.awakenerId,
    })
  }
}

function validateMemberWheels(
  member: TeamMember,
  teamId: string,
  settings: TeamRulesConfig,
  sharedSeen: SharedSeenState,
  teamSeen: TeamSeenState,
  violations: RuleViolation[],
) {
  if (!settings.enforceUniqueWheels) {
    return
  }

  for (const wheelId of member.wheelIds) {
    if (teamSeen.wheels.has(wheelId)) {
      violations.push({
        code: 'DUPLICATE_WHEEL',
        message: `Wheel ${wheelId} is used more than once in team ${teamId}.`,
        teamId,
        value: wheelId,
      })
      continue
    }

    if (!member.isSupport && sharedSeen.wheels.has(wheelId)) {
      violations.push({
        code: 'DUPLICATE_WHEEL',
        message: `Wheel ${wheelId} is used more than once across teams.`,
        teamId,
        value: wheelId,
      })
    }
  }
}

function recordMemberUsage(
  member: TeamMember,
  sharedSeen: SharedSeenState,
  teamSeen: TeamSeenState,
) {
  teamSeen.awakeners.add(member.awakenerId)
  if (!member.isSupport) {
    sharedSeen.awakeners.add(member.awakenerId)
  }

  for (const wheelId of member.wheelIds) {
    teamSeen.wheels.add(wheelId)
    if (!member.isSupport) {
      sharedSeen.wheels.add(wheelId)
    }
  }
}

function validateTeamMembers(
  team: TeamPlan,
  settings: TeamRulesConfig,
  sharedSeen: SharedSeenState,
  violations: RuleViolation[],
): number {
  const teamSeen: TeamSeenState = {
    awakeners: new Set<string>(),
    wheels: new Set<string>(),
  }
  let supportCount = 0

  for (const member of team.members) {
    if (member.isSupport) {
      supportCount += 1
    }

    validateMemberAwakener(member, team.id, settings, sharedSeen, teamSeen, violations)
    validateMemberWheels(member, team.id, settings, sharedSeen, teamSeen, violations)
    recordMemberUsage(member, sharedSeen, teamSeen)
  }

  return supportCount
}

function pushSupportViolation(violations: RuleViolation[]) {
  violations.push({
    code: 'MULTIPLE_SUPPORT_AWAKENERS',
    message: 'Only one support awakener is allowed across the whole build.',
  })
}

export function validateTeamPlan(
  teamPlan: TeamPlan[],
  config: Partial<TeamRulesConfig> = {},
): {isValid: boolean; violations: RuleViolation[]} {
  const settings = {...DEFAULT_TEAM_RULES_CONFIG, ...config}
  const violations: RuleViolation[] = []

  if (teamPlan.length > settings.maxTeams) {
    pushTeamCountViolation(violations, settings.maxTeams)
  }

  const sharedSeen: SharedSeenState = {
    awakeners: new Set<string>(),
    wheels: new Set<string>(),
    posses: new Set<string>(),
  }
  let supportCount = 0

  for (const team of teamPlan) {
    validateTeamPosse(team, settings, sharedSeen, violations)
    validateTeamRealmLimit(team, settings, violations)
    supportCount += validateTeamMembers(team, settings, sharedSeen, violations)
  }

  if (supportCount > 1) {
    pushSupportViolation(violations)
  }

  return {
    isValid: violations.length === 0,
    violations,
  }
}
