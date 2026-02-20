import { describe, expect, it } from 'vitest'
import { validateTeamPlan, type TeamPlan } from './team-rules'

function buildValidPlan(): TeamPlan[] {
  return [
    {
      id: 'team-1',
      posseId: 'posse-a',
      members: [
        { awakenerId: 'agrippa', faction: 'CARO', wheelIds: ['w1', 'w2'] },
        { awakenerId: 'helot: catena', faction: 'CARO', wheelIds: ['w3', 'w4'] },
        { awakenerId: 'tulu', faction: 'AEQUOR', wheelIds: ['w5', 'w6'] },
        { awakenerId: 'miryam', faction: 'AEQUOR', wheelIds: ['w7', 'w8'] },
      ],
    },
    {
      id: 'team-2',
      posseId: 'posse-b',
      members: [
        { awakenerId: 'goliath', faction: 'AEQUOR', wheelIds: ['w9', 'w10'] },
        { awakenerId: 'ramona: timeworn', faction: 'CHAOS', wheelIds: ['w11', 'w12'] },
      ],
    },
  ]
}

describe('validateTeamPlan', () => {
  it('accepts a plan with <= 10 teams, unique awakeners/wheels, and <= 2 factions per team', () => {
    const result = validateTeamPlan(buildValidPlan())
    expect(result.isValid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('rejects plans with more than 10 teams', () => {
    const teams: TeamPlan[] = Array.from({ length: 11 }, (_, index) => ({
      id: `team-${index + 1}`,
      members: [],
    }))
    const result = validateTeamPlan(teams)

    expect(result.isValid).toBe(false)
    expect(result.violations.some((v) => v.code === 'TEAM_COUNT_EXCEEDED')).toBe(true)
  })

  it('rejects teams with more than 2 factions', () => {
    const plan = buildValidPlan()
    plan[0].members.push({ awakenerId: 'wanda', faction: 'ULTRA', wheelIds: ['w13', 'w14'] })

    const result = validateTeamPlan(plan)

    expect(result.isValid).toBe(false)
    expect(result.violations.some((v) => v.code === 'TOO_MANY_FACTIONS_IN_TEAM')).toBe(true)
  })

  it('rejects duplicate awakeners across teams', () => {
    const plan = buildValidPlan()
    plan[1].members.push({ awakenerId: 'agrippa', faction: 'CARO', wheelIds: ['w15', 'w16'] })

    const result = validateTeamPlan(plan)

    expect(result.isValid).toBe(false)
    expect(result.violations.some((v) => v.code === 'DUPLICATE_AWAKENER' && v.value === 'agrippa')).toBe(
      true,
    )
  })

  it('rejects duplicate wheels across all teams', () => {
    const plan = buildValidPlan()
    plan[1].members.push({ awakenerId: 'casiah', faction: 'ULTRA', wheelIds: ['w2', 'w17'] })

    const result = validateTeamPlan(plan)

    expect(result.isValid).toBe(false)
    expect(result.violations.some((v) => v.code === 'DUPLICATE_WHEEL' && v.value === 'w2')).toBe(true)
  })

  it('rejects duplicate posse selections across all teams', () => {
    const plan = buildValidPlan()
    plan[1].posseId = 'posse-a'

    const result = validateTeamPlan(plan)

    expect(result.isValid).toBe(false)
    expect(result.violations.some((v) => v.code === 'DUPLICATE_POSSE' && v.value === 'posse-a')).toBe(
      true,
    )
  })
})
