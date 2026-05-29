import type {ActiveSelection, PickerTab, QuickLineupStep, Team, TeamSlot} from './types'

interface InternalQuickLineupSession {
  teamId: string
  originalTeam: Team
  currentStepIndex: number
  steps: QuickLineupStep[]
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

function slotHasAwakener(slots: TeamSlot[], slotId: string): boolean {
  return Boolean(slots.find((slot) => slot.slotId === slotId)?.awakenerId)
}

function isQuickLineupStepAvailable(step: QuickLineupStep, slots: TeamSlot[]): boolean {
  return step.kind === 'awakener' || step.kind === 'posse' || slotHasAwakener(slots, step.slotId)
}

export function resolveQuickLineupStepForSlots(
  step: QuickLineupStep,
  slots: TeamSlot[],
): QuickLineupStep {
  if (step.kind === 'awakener' || step.kind === 'posse' || slotHasAwakener(slots, step.slotId)) {
    return step
  }

  return {kind: 'awakener', slotId: step.slotId}
}

export function getPublicQuickLineupSession(
  session: InternalQuickLineupSession,
  currentSlots: TeamSlot[] = [],
) {
  const currentStep = getQuickLineupStepAtIndex(session, session.currentStepIndex)
  if (!currentStep) {
    return null
  }
  return {
    isActive: true as const,
    currentStepIndex: session.currentStepIndex,
    currentStep,
    totalSteps: session.steps.length,
    canGoBack:
      currentSlots.length > 0
        ? findPreviousQuickLineupStepIndex(session, currentSlots) !== null
        : session.currentStepIndex > 0,
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
  for (let index = session.currentStepIndex + 1; index < session.steps.length; index += 1) {
    const step = session.steps[index]
    if (isQuickLineupStepAvailable(step, currentSlots)) {
      return index
    }
  }

  return null
}

export function findPreviousQuickLineupStepIndex(
  session: InternalQuickLineupSession,
  currentSlots: TeamSlot[],
): number | null {
  for (let index = session.currentStepIndex - 1; index >= 0; index -= 1) {
    const step = session.steps[index]
    if (isQuickLineupStepAvailable(step, currentSlots)) {
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

  const reconciledStep = resolveQuickLineupStepForSlots(targetStep, nextSlots)

  const nextStepIndex = findQuickLineupStepIndex(session, reconciledStep)
  if (nextStepIndex === -1) {
    return session
  }

  return goToQuickLineupStep(session, nextStepIndex) ?? session
}

export type {InternalQuickLineupSession}
