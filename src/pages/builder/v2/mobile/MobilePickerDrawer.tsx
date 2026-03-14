import type {ReactNode} from 'react'

import {getAwakenerCardAsset} from '@/domain/awakener-assets'

import {useBuilderStore} from '../store/builder-store'
import {selectActiveTeamSlots} from '../store/selectors'
import type {PickerContext} from './MobileViewState'

function getContextLabel(context: PickerContext): string {
  const target = context.target.charAt(0).toUpperCase() + context.target.slice(1)
  if (context.target === 'wheel' && context.wheelIndex !== undefined) {
    return `Wheel ${String(context.wheelIndex + 1)}`
  }
  return `Change ${target}`
}

interface MobilePickerDrawerProps {
  context: PickerContext
  returnSlotIndex: number
  onClose: () => void
  picker: ReactNode
}

export function MobilePickerDrawer({
  context,
  returnSlotIndex,
  onClose,
  picker,
}: MobilePickerDrawerProps) {
  const slots = useBuilderStore(selectActiveTeamSlots)
  const slot = slots[returnSlotIndex]
  const awakenerName = slot.awakenerName
  const cardAsset = awakenerName ? getAwakenerCardAsset(awakenerName) : undefined

  const panelStyle = {
    width: 'min(max(18rem, 72vw), 34rem)',
    maxWidth: 'calc(100vw - 4rem)',
  } as const

  return (
    <div className='absolute inset-0 z-40 flex'>
      <button
        className='relative flex flex-1 items-center justify-center bg-[#0c121c]/88 backdrop-blur-[1px]'
        onClick={onClose}
        type='button'
      >
        {cardAsset ? (
          <div
            className='relative overflow-hidden border border-slate-500/45 opacity-25'
            style={{aspectRatio: '25/56', width: '70px'}}
          >
            <img
              alt=''
              className='absolute inset-0 h-full w-full object-cover object-top'
              draggable={false}
              src={cardAsset}
            />
          </div>
        ) : (
          <span className='sr-only'>Close picker</span>
        )}
      </button>

      <div
        className='z-20 flex shrink-0 flex-col border-l border-slate-500/45 bg-slate-900/[0.96]'
        style={panelStyle}
      >
        <div className='shrink-0 border-b border-slate-500/45 px-3 py-1.5'>
          <p className='text-[10px] font-bold text-amber-400'>
            Slot {String(returnSlotIndex + 1)} &mdash; {getContextLabel(context)}
          </p>
        </div>

        <div className='flex min-h-0 flex-1 flex-col overflow-hidden'>{picker}</div>

        <div className='shrink-0 border-t border-slate-500/45 px-2 py-1.5'>
          <button
            className='w-full border border-slate-500/45 py-1 text-[10px] text-slate-300'
            onClick={onClose}
            type='button'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
