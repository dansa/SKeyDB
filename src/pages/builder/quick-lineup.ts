import type {ActiveSelection, PickerTab, QuickLineupStep, Team, TeamSlot} from './types'

interface InternalQuickLineupSession {
  teamId: string
  originalTeam: Team
  currentStepIndex: number
  steps: QuickLineupStep[]
  history: number[]
}

export function cloneTeam(team: Team): Team {
  return {
    ...team,
    slots: team.slots.map(cloneTeamSlot),
  }
}

function cloneTeamSlot(slot: TeamSlot): TeamSlot {
  return {
    ...slot,
    wheels: [...slot.wheels] as [string | null, string | null],
  }
}

export function buildQuickLineupSteps(slots: TeamSlot[]): QuickLineupStep[] {
  return [
    ...slots.flatMap<QuickLineupStep>((slot) => [
      {kind: 'awakener', slotId: slot.slotId},
      {kind: 'wheel', slotId: slot.slotId, wheelIndex: 0},
      {kind: 'wheel', slotId: slot.slotId, wheelIndex: 1},
      {kind: 'covenant', slotId: slot.slotId},
    ]),
    {kind: 'posse'},
  ]
}

export function createQuickLineupSession(team: Team): InternalQuickLineupSession {
  return {
    teamId: team.id,
    originalTeam: cloneTeam(team),
    currentStepIndex: 0,
    steps: buildQuickLineupSteps(team.slots),
    history: [0],
  }
}

export function getQuickLineupStepPickerTab(step: QuickLineupStep): PickerTab {
  if (step.kind === 'awakener') {
    return 'awakeners'
  }
  if (step.kind === 'wheel') {
    return 'wheels'
  }
  if (step.kind === 'covenant') {
    return 'covenants'
  }
  return 'posses'
}

export function getQuickLineupStepSelection(step: QuickLineupStep): ActiveSelection {
  if (step.kind === 'posse') {
    return null
  }
  return step
}

export function getQuickLineupStepAtIndex(
  session: InternalQuickLineupSession,
  stepIndex: number,
): QuickLineupStep | null {
  return session.steps[stepIndex] ?? null
}

export function getPublicQuickLineupSession(session: InternalQuickLineupSession) {
  const currentStep = getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!currentStep) {
    return null
  }
  return {
    isActive: true as const,
    currentStepIndex: session.currentStepIndex,
    currentStep,
    totalSteps: session.steps.length,
    canGoBack: session.history.length > 1,
  }
}

export function goToQuickLineupStep(
  session: InternalQuickLineupSession,
  nextStepIndex: number,
): InternalQuickLineupSession | null {
  if (nextStepIndex < 0 || nextStepIndex >= session.steps.length) {
    return null
  }

  if (nextStepIndex === session.currentStepIndex) {
    return session
  }

  return {
    ...session,
    currentStepIndex: nextStepIndex,
    history: [...session.history, nextStepIndex],
  }
}

export function goBackQuickLineupHistory(
  session: InternalQuickLineupSession,
): InternalQuickLineupSession | null {
  if (session.history.length <= 1) {
    return null
  }

  const nextHistory = session.history.slice(0, -1)
  const previousStepIndex = nextHistory.at(-1)
  if (previousStepIndex === undefined) {
    return null
  }

  return {
    ...session,
    currentStepIndex: previousStepIndex,
    history: nextHistory,
  }
}

export function findQuickLineupStepIndex(
  session: InternalQuickLineupSession,
  step: QuickLineupStep,
): number {
  return session.steps.findIndex((candidate) => {
    if (candidate.kind !== step.kind) {
      return false
    }
    if (candidate.kind === 'posse' && step.kind === 'posse') {
      return true
    }
    if ('slotId' in candidate && 'slotId' in step && candidate.slotId !== step.slotId) {
      return false
    }
    if (candidate.kind === 'wheel' && step.kind === 'wheel') {
      return candidate.wheelIndex === step.wheelIndex
    }
    return true
  })
}

export function findNextQuickLineupStepIndex(
  session: InternalQuickLineupSession,
  currentSlots: TeamSlot[],
): number | null {
  const currentStep = getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!currentStep) {
    return null
  }

  if (currentStep.kind !== 'awakener') {
    return session.currentStepIndex + 1 < session.steps.length ? session.currentStepIndex + 1 : null
  }

  const currentSlot = currentSlots.find((slot) => slot.slotId === currentStep.slotId)
  if (currentSlot?.awakenerName) {
    return session.currentStepIndex + 1 < session.steps.length ? session.currentStepIndex + 1 : null
  }

  for (let index = session.currentStepIndex + 1; index < session.steps.length; index += 1) {
    if (session.steps[index]?.kind === 'awakener' || session.steps[index]?.kind === 'posse') {
      return index
    }
  }

  return null
}

export function reconcileQuickLineupSessionAfterSlotsChange(
  session: InternalQuickLineupSession,
  nextSlots: TeamSlot[],
  preferredStep: QuickLineupStep | null = null,
): InternalQuickLineupSession {
  const targetStep = preferredStep ?? getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!targetStep || targetStep.kind === 'posse') {
    return session
  }

  const targetSlot = nextSlots.find((slot) => slot.slotId === targetStep.slotId)
  const reconciledStep =
    targetStep.kind === 'awakener' || targetSlot?.awakenerName
      ? targetStep
      : ({kind: 'awakener', slotId: targetStep.slotId} satisfies QuickLineupStep)

  const nextStepIndex = findQuickLineupStepIndex(session, reconciledStep)
  if (nextStepIndex === -1) {
    return session
  }

  return goToQuickLineupStep(session, nextStepIndex) ?? session
}

export type {InternalQuickLineupSession}
