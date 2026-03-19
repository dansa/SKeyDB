import {useCallback, useEffect, useRef, type ReactNode} from 'react'

import {Button} from '@/components/ui/Button'

import {
  buildQuickLineupSteps,
  findPreviousQuickLineupStepIndex,
  type InternalQuickLineupSession,
} from '../../quick-lineup'
import {useMeasuredElementSize, useViewportSize} from '../layout-hooks'
import {
  getQuickLineupActiveTarget,
  getQuickLineupStepContextLabel,
  isQuickLineupSlotActive,
} from '../quick-lineup-model'
import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeamSlots} from '../store/selectors'
import type {QuickLineupStep} from '../store/types'
import {MobileBuilderScreen} from './MobileBuilderScreen'
import {getQuickLineupLayoutMetrics, getQuickLineupLayoutMode} from './quick-lineup-layout'
import {QuickLineupSlotCard} from './quick-lineup/QuickLineupSlotCard'

interface MobileQuickLineupProps {
  onExit: () => void
  renderPicker: (options: {enableDragAndDrop: boolean; onItemSelected: () => void}) => ReactNode
}

type QuickLineupStartupPhase = 'pending' | 'starting' | 'active'

export function MobileQuickLineup({onExit, renderPicker}: MobileQuickLineupProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const quickLineupSessionState = useBuilderStore((state) => state.quickLineupSessionState)
  const startQuickLineup = useBuilderStore((state) => state.startQuickLineup)
  const finishQuickLineup = useBuilderStore((state) => state.finishQuickLineup)
  const cancelQuickLineup = useBuilderStore((state) => state.cancelQuickLineup)
  const nextQuickLineupStep = useBuilderStore((state) => state.nextQuickLineupStep)
  const prevQuickLineupStep = useBuilderStore((state) => state.prevQuickLineupStep)
  const skipQuickLineupStep = useBuilderStore((state) => state.skipQuickLineupStep)
  const jumpToQuickLineupStep = useBuilderStore((state) => state.jumpToQuickLineupStep)
  const {height, ref, width} = useMeasuredElementSize()
  const {height: viewportHeight, width: viewportWidth} = useViewportSize()
  const initialStepsRef = useRef<QuickLineupStep[] | null>(null)
  const startupPhaseRef = useRef<QuickLineupStartupPhase>('pending')

  initialStepsRef.current ??= buildQuickLineupSteps(slots)

  useEffect(() => {
    if (startupPhaseRef.current !== 'pending') {
      return
    }

    startupPhaseRef.current = 'starting'
    startQuickLineup(initialStepsRef.current ?? [])
  }, [startQuickLineup])

  useEffect(() => {
    if (quickLineupSessionState !== null) {
      startupPhaseRef.current = 'active'
      return
    }

    if (startupPhaseRef.current !== 'active') {
      return
    }

    startupPhaseRef.current = 'pending'
    onExit()
  }, [onExit, quickLineupSessionState])

  const currentStep = quickLineupSessionState
    ? getCurrentQuickLineupStep(quickLineupSessionState)
    : null
  const canGoBack =
    quickLineupSessionState !== null &&
    findPreviousQuickLineupStepIndex(quickLineupSessionState, slots) !== null
  const quickLineupStepIndex = quickLineupSessionState?.currentStepIndex ?? 0
  const totalSteps = quickLineupSessionState?.steps.length ?? 0
  const resolvedViewportWidth = viewportWidth || window.innerWidth
  const resolvedViewportHeight = viewportHeight || window.innerHeight
  const layoutMode = getQuickLineupLayoutMode(resolvedViewportWidth, resolvedViewportHeight)
  const metrics = getQuickLineupLayoutMetrics(
    width || resolvedViewportWidth,
    height || resolvedViewportHeight,
    layoutMode,
  )
  const contextLabel = currentStep
    ? getQuickLineupStepContextLabel(currentStep, slots)
    : 'Quick Lineup'

  const handlePickerItemSelected = useCallback(() => {
    nextQuickLineupStep(quickLineupStepIndex)
  }, [nextQuickLineupStep, quickLineupStepIndex])

  if (!quickLineupSessionState) {
    return (
      <MobileBuilderScreen
        className='bg-[#0c121c]'
        data-layout-mode={metrics.mode}
        testId='mobile-quick-lineup-shell'
      >
        <div className='flex min-h-0 flex-1 items-center justify-center px-4 text-center text-xs tracking-[0.12em] text-slate-500 uppercase'>
          Preparing Quick Lineup
        </div>
      </MobileBuilderScreen>
    )
  }

  return (
    <MobileBuilderScreen
      testId='mobile-quick-lineup-shell'
      className='bg-[#0c121c]'
      data-layout-mode={metrics.mode}
    >
      <header className='shrink-0 border-b border-slate-500/45 bg-slate-950/78 px-3 py-2'>
        <div className='flex items-center justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-[10px] font-bold tracking-[0.16em] text-amber-300 uppercase'>
              {`Step ${String(quickLineupStepIndex + 1)} / ${String(totalSteps)}`}
            </p>
            <p className='truncate pt-1 text-[11px] text-slate-300'>{contextLabel}</p>
          </div>
          <div className='flex shrink-0 items-center gap-2'>
            <HeaderButton label='Cancel' onClick={cancelQuickLineup} variant='danger' />
            <HeaderButton label='Finish' onClick={finishQuickLineup} variant='primary' />
          </div>
        </div>
      </header>

      <div className='min-h-0 flex-1 overflow-hidden' ref={ref}>
        {metrics.mode === 'portrait' ? (
          <div className='flex h-full min-h-0 flex-col' data-layout-mode='portrait'>
            <div className='shrink-0 border-b border-slate-500/40 bg-slate-900/35 px-2 py-2'>
              <div
                className='grid grid-cols-4 justify-items-center'
                style={{columnGap: `${String(metrics.gap)}px`}}
              >
                {slots.map((slot, index) => (
                  <QuickLineupSlotCard
                    activeTarget={
                      currentStep ? getQuickLineupActiveTarget(slot.slotId, currentStep) : null
                    }
                    cardHeight={metrics.cardHeight}
                    cardWidth={metrics.cardWidth}
                    isActiveSlot={
                      currentStep ? isQuickLineupSlotActive(slot.slotId, currentStep) : false
                    }
                    key={slot.slotId}
                    layout='portrait'
                    onJumpToStep={jumpToQuickLineupStep}
                    slot={slot}
                    slotIndex={index}
                  />
                ))}
              </div>
            </div>

            <div className='min-h-0 flex-1 overflow-hidden'>
              {renderPicker({
                enableDragAndDrop: false,
                onItemSelected: handlePickerItemSelected,
              })}
            </div>

            <QuickLineupFooter
              canGoBack={canGoBack}
              compact={false}
              onBack={() => {
                prevQuickLineupStep(quickLineupStepIndex)
              }}
              onNext={() => {
                skipQuickLineupStep(quickLineupStepIndex)
              }}
              stepIndex={quickLineupStepIndex}
              totalSteps={totalSteps}
            />
          </div>
        ) : (
          <div className='flex h-full min-h-0 overflow-hidden' data-layout-mode='landscape'>
            <div
              data-testid='quick-lineup-landscape-rail'
              className='flex min-h-0 shrink-0 flex-col border-r border-slate-500/40 bg-slate-900/35'
              style={{width: `${String(metrics.railSize)}px`}}
            >
              <div
                className='flex min-h-0 flex-1 flex-col items-center'
                style={{
                  gap: `${String(metrics.gap)}px`,
                  padding: `${String(metrics.gap)}px`,
                }}
              >
                {slots.map((slot, index) => (
                  <QuickLineupSlotCard
                    activeTarget={
                      currentStep ? getQuickLineupActiveTarget(slot.slotId, currentStep) : null
                    }
                    cardHeight={metrics.cardHeight}
                    cardWidth={metrics.cardWidth}
                    isActiveSlot={
                      currentStep ? isQuickLineupSlotActive(slot.slotId, currentStep) : false
                    }
                    key={slot.slotId}
                    layout='landscape'
                    onJumpToStep={jumpToQuickLineupStep}
                    slot={slot}
                    slotIndex={index}
                  />
                ))}
              </div>

              <QuickLineupFooter
                canGoBack={canGoBack}
                compact
                onBack={() => {
                  prevQuickLineupStep(quickLineupStepIndex)
                }}
                onNext={() => {
                  skipQuickLineupStep(quickLineupStepIndex)
                }}
                stepIndex={quickLineupStepIndex}
                totalSteps={totalSteps}
              />
            </div>

            <div
              className='min-h-0 min-w-0 flex-1 overflow-hidden border-l border-slate-900/70 bg-slate-950/82'
              data-testid='quick-lineup-landscape-picker'
            >
              <div
                className='flex h-full min-h-0 flex-col overflow-hidden'
                data-testid='quick-lineup-landscape-picker-frame'
              >
                {renderPicker({
                  enableDragAndDrop: false,
                  onItemSelected: handlePickerItemSelected,
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </MobileBuilderScreen>
  )
}

function getCurrentQuickLineupStep(session: InternalQuickLineupSession): QuickLineupStep | null {
  return session.steps[session.currentStepIndex] ?? null
}

function HeaderButton({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: 'danger' | 'primary'
}) {
  return (
    <Button
      className='px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase'
      onClick={onClick}
      type='button'
      variant={variant}
    >
      {label}
    </Button>
  )
}

function QuickLineupFooter({
  canGoBack,
  compact,
  onBack,
  onNext,
  stepIndex,
  totalSteps,
}: {
  canGoBack: boolean
  compact: boolean
  onBack: () => void
  onNext: () => void
  stepIndex: number
  totalSteps: number
}) {
  return (
    <footer
      className={`shrink-0 border-t border-slate-500/40 bg-slate-950/78 ${
        compact ? 'px-2 py-1' : 'px-3 py-2'
      }`}
    >
      <div className='flex items-center justify-between gap-2'>
        <Button
          className={`tracking-[0.12em] uppercase ${compact ? 'flex-1 px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}`}
          disabled={!canGoBack}
          onClick={onBack}
          type='button'
        >
          Back
        </Button>
        <span className={compact ? 'text-[8px] text-slate-500' : 'text-[10px] text-slate-500'}>
          {compact
            ? `${String(stepIndex + 1)}/${String(totalSteps)}`
            : `${String(stepIndex + 1)} / ${String(totalSteps)}`}
        </span>
        <Button
          className={`tracking-[0.12em] uppercase ${compact ? 'flex-1 px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'}`}
          onClick={onNext}
          type='button'
          variant='primary'
        >
          Next
        </Button>
      </div>
    </footer>
  )
}
