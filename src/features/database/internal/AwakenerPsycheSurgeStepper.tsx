import {useEffect, useRef, type ReactNode} from 'react'

import {FaMinus, FaPlus} from 'react-icons/fa6'

import {useHoldRepeatAction} from '@/components/ui/useHoldRepeatAction'
import {BufferedLevelInput} from '@/ui/modal/BufferedLevelInput'
import {CALCULATION_CONTEXT_CONTROL_PROPS} from '@/ui/modal/calculationContextControl'

interface AwakenerPsycheSurgeStepperProps {
  max: number
  min: number
  offset: number
  onChange: (offset: number) => void
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
  max,
  min,
  offset,
  onChange,
}: AwakenerPsycheSurgeStepperProps) {
  const offsetRef = useRef(offset)

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  function commitOffset(nextOffset: number) {
    const boundedOffset = Math.min(max, Math.max(min, nextOffset))
    if (boundedOffset === offsetRef.current) {
      return
    }

    offsetRef.current = boundedOffset
    onChange(boundedOffset)
  }

  return (
    <div
      aria-label='Psyche Surge'
      className='flex items-center gap-1.5'
      {...CALCULATION_CONTEXT_CONTROL_PROPS}
      role='group'
      title='Psyche Surge substat bonus'
    >
      <StepButton
        ariaLabel='Decrease Psyche Surge'
        disabled={offset <= min}
        onStep={() => {
          commitOffset(offsetRef.current - 1)
        }}
      >
        <FaMinus className='size-2.5' />
      </StepButton>
      <span className='flex min-w-[3.75rem] items-center justify-center rounded border border-slate-500/55 bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] focus-within:border-amber-200/60'>
        <span aria-hidden className='text-slate-400'>
          E3
        </span>
        <span aria-hidden className='text-slate-500'>
          +
        </span>
        <BufferedLevelInput
          ariaLabel='Psyche Surge bonus'
          className='w-[1.25rem] border-0 bg-transparent p-0 text-left font-mono text-[10px] tracking-normal text-slate-200 outline-none focus:text-amber-100'
          max={max}
          min={min}
          onCommit={commitOffset}
          title={`Psyche Surge bonus (${String(min)}–${String(max)})`}
          value={offset}
        />
      </span>
      <StepButton
        ariaLabel='Increase Psyche Surge'
        disabled={offset >= max}
        onStep={() => {
          commitOffset(offsetRef.current + 1)
        }}
      >
        <FaPlus className='size-2.5' />
      </StepButton>
    </div>
  )
}
