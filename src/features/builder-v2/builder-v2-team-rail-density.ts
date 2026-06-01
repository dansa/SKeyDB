export interface BuilderV2TeamRailDensity {
  isFullHeightRail: boolean
  middleRowCount: number
  shouldDockNearFullRail: boolean
}

export function getBuilderV2TeamRailDensity({
  canAddTeam,
  maxTeams,
  teamCount,
}: {
  canAddTeam: boolean
  maxTeams: number
  teamCount: number
}): BuilderV2TeamRailDensity {
  const renderedRowCount = teamCount + (canAddTeam ? 1 : 0)

  return {
    isFullHeightRail: renderedRowCount >= maxTeams,
    middleRowCount: Math.max(renderedRowCount - 2, 0),
    shouldDockNearFullRail: renderedRowCount >= Math.max(maxTeams - 2, 1),
  }
}

export function getBuilderV2ActiveWorkspaceClassName(density: BuilderV2TeamRailDensity): string {
  return [
    'builder-v2-active-workspace',
    density.isFullHeightRail ? 'builder-v2-active-workspace--rail-full' : '',
    density.shouldDockNearFullRail ? 'builder-v2-active-workspace--rail-near-full' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function getBuilderV2TeamRailClassName(density: BuilderV2TeamRailDensity): string {
  return [
    'builder-v2-team-rail',
    density.isFullHeightRail ? 'builder-v2-team-rail--full' : '',
    density.shouldDockNearFullRail ? 'builder-v2-team-rail--near-full' : '',
  ]
    .filter(Boolean)
    .join(' ')
}
