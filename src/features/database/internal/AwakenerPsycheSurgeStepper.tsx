import type {ReactNode} from 'react'

import {FaMinus, FaPlus} from 'react-icons/fa6'

import {useHoldRepeatAction} from '@/components/ui/useHoldRepeatAction'

interface AwakenerPsycheSurgeStepperProps {
  offset: number
  onDecrease: () => void
  onIncrease: () => void
}

interface StepButtonProps {
  ariaLabel: string
  disabled: boolean
  onStep: () => void
  children: ReactNode
}

function StepButton({ariaLabel, disabled, onStep, children}: StepButtonProps) {
  const hold = useHoldRepeatAction({onStep, disabled})

  return (
    <button
      aria-label={ariaLabel}
      className='flex size-5 items-center justify-center border border-slate-500/45 bg-slate-950/70 text-[9px] text-slate-300 transition-colors hover:border-slate-300/55 hover:text-slate-100 disabled:cursor-default disabled:border-slate-700/45 disabled:text-slate-600'
      disabled={disabled}
      onBlur={hold.onBlur}
      onClick={hold.onClick}
      onPointerCancel={hold.onPointerCancel}
      onPointerDown={hold.onPointerDown}
      onPointerLeave={hold.onPointerLeave}
      onPointerUp={hold.onPointerUp}
      type='button'
    >
      {children}
    </button>
  )
}

export function AwakenerPsycheSurgeStepper({
  offset,
  onDecrease,
  onIncrease,
}: AwakenerPsycheSurgeStepperProps) {
  return (
    <div
      aria-label='Psyche Surge'
      className='flex items-center gap-1.5'
      data-detail-modal-popover-preserve=''
      title='Psyche Surge substat bonus'
    >
      <StepButton ariaLabel='Decrease Psyche Surge' disabled={offset <= 0} onStep={onDecrease}>
        <FaMinus className='size-2.5' />
      </StepButton>
      <span className='min-w-[3.75rem] rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 text-center font-mono text-[10px] text-slate-200'>
        E3+{offset}
      </span>
      <StepButton ariaLabel='Increase Psyche Surge' disabled={offset >= 12} onStep={onIncrease}>
        <FaPlus className='size-2.5' />
      </StepButton>
    </div>
  )
}
