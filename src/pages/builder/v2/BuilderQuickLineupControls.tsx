import {Button} from '@/components/ui/Button'

import {buildQuickLineupSteps, findPreviousQuickLineupStepIndex} from '../quick-lineup'
import {getQuickLineupStepContextLabel} from './quick-lineup-model'
import {useBuilderStore} from './store/builder-store'
import {selectActiveTeamSlots} from './store/selectors'

interface BuilderQuickLineupControlsProps {
  compact?: boolean
  placement?: 'top' | 'bottom'
  appearance?: 'default' | 'tablet'
}

export function BuilderQuickLineupControls({
  compact = false,
  placement = 'bottom',
  appearance = compact ? 'tablet' : 'default',
}: BuilderQuickLineupControlsProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const quickLineupSessionState = useBuilderStore((state) => state.quickLineupSessionState)
  const startQuickLineup = useBuilderStore((state) => state.startQuickLineup)
  const finishQuickLineup = useBuilderStore((state) => state.finishQuickLineup)
  const cancelQuickLineup = useBuilderStore((state) => state.cancelQuickLineup)
  const prevQuickLineupStep = useBuilderStore((state) => state.prevQuickLineupStep)
  const skipQuickLineupStep = useBuilderStore((state) => state.skipQuickLineupStep)

  if (!quickLineupSessionState) {
    if (compact && placement === 'top') {
      return null
    }

    return (
      <div
        className={`flex justify-end ${compact ? 'px-2 py-1.5' : 'px-4 py-3'}`}
        data-testid='builder-quick-lineup-controls'
      >
        <Button
          className='px-3 py-1 text-[10px] tracking-[0.12em] uppercase'
          onClick={() => {
            startQuickLineup(buildQuickLineupSteps(slots))
          }}
          type='button'
        >
          Quick Lineup
        </Button>
      </div>
    )
  }

  const currentStep = quickLineupSessionState.steps[quickLineupSessionState.currentStepIndex]
  const canGoBack = findPreviousQuickLineupStepIndex(quickLineupSessionState, slots) !== null
  if (appearance === 'tablet') {
    return (
      <div className='px-3 py-2' data-testid='builder-quick-lineup-controls'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <p className='text-[10px] font-bold tracking-[0.14em] text-amber-300 uppercase'>
              {`Step ${String(quickLineupSessionState.currentStepIndex + 1)} / ${String(quickLineupSessionState.steps.length)}`}
            </p>
            <p
              className='truncate pt-1 text-[11px] text-slate-300'
              data-testid='builder-quick-lineup-status'
            >
              {getQuickLineupStepContextLabel(currentStep, slots)}
            </p>
          </div>

          <div className='flex shrink-0 flex-wrap items-center justify-end gap-1.5'>
            <Button
              className='px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase'
              disabled={!canGoBack}
              onClick={() => {
                prevQuickLineupStep(quickLineupSessionState.currentStepIndex)
              }}
              type='button'
            >
              Back
            </Button>
            <Button
              className='px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase'
              onClick={() => {
                skipQuickLineupStep(quickLineupSessionState.currentStepIndex)
              }}
              type='button'
              variant='primary'
            >
              Next
            </Button>
            <Button
              className='px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase'
              onClick={cancelQuickLineup}
              type='button'
              variant='danger'
            >
              Cancel
            </Button>
            <Button
              className='px-2.5 py-1 text-[10px] tracking-[0.12em] uppercase'
              onClick={finishQuickLineup}
              type='button'
            >
              Finish
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={compact ? 'px-2 py-1.5' : 'px-4 py-3'}
      data-testid='builder-quick-lineup-controls'
    >
      <div className='flex flex-wrap items-center justify-end gap-2'>
        <Button
          className='px-3 py-1 text-[10px] tracking-[0.12em] uppercase'
          disabled={!canGoBack}
          onClick={() => {
            prevQuickLineupStep(quickLineupSessionState.currentStepIndex)
          }}
          type='button'
        >
          Back
        </Button>
        <Button
          className='px-3 py-1 text-[10px] tracking-[0.12em] uppercase'
          onClick={() => {
            skipQuickLineupStep(quickLineupSessionState.currentStepIndex)
          }}
          type='button'
          variant='primary'
        >
          Next
        </Button>
        <Button
          className='px-3 py-1 text-[10px] tracking-[0.12em] uppercase'
          onClick={cancelQuickLineup}
          type='button'
          variant='danger'
        >
          Cancel
        </Button>
        <Button
          className='px-3 py-1 text-[10px] tracking-[0.12em] uppercase'
          onClick={finishQuickLineup}
          type='button'
        >
          Finish
        </Button>
      </div>

      <p
        className='mt-1 min-h-[1rem] text-right text-[11px] tracking-wide text-slate-300'
        data-testid='builder-quick-lineup-status'
      >
        {`Step ${String(quickLineupSessionState.currentStepIndex + 1)} / ${String(quickLineupSessionState.steps.length)}: ${getQuickLineupStepContextLabel(currentStep, slots)}`}
      </p>
    </div>
  )
}
