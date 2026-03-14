import {useCallback, useState, type ReactNode} from 'react'

import {PickerDrawer} from './PickerDrawer'

interface BuilderMobileLayoutProps {
  toolbar?: ReactNode
  activeTeamHeader?: ReactNode
  teamCards: ReactNode
  teamsPanel: ReactNode
  picker: ReactNode
  pickerToggleLabel?: string
}

export function BuilderMobileLayout({
  toolbar,
  activeTeamHeader,
  teamCards,
  teamsPanel,
  picker,
  pickerToggleLabel = 'Picker',
}: BuilderMobileLayoutProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const openPicker = useCallback(() => {
    setIsPickerOpen(true)
  }, [])

  const closePicker = useCallback(() => {
    setIsPickerOpen(false)
  }, [])

  return (
    <div className='w-full px-2 py-3'>
      {toolbar ? <div className='mb-2'>{toolbar}</div> : null}

      <div className='space-y-2'>
        {activeTeamHeader}
        <div>{teamCards}</div>
        <div>{teamsPanel}</div>
      </div>

      <button
        className='fixed bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-lg border border-amber-300/50 bg-slate-800 px-5 py-3 text-sm font-medium text-amber-100 shadow-lg transition-colors hover:bg-slate-700'
        onClick={openPicker}
        type='button'
      >
        {pickerToggleLabel}
      </button>

      <PickerDrawer isOpen={isPickerOpen} onClose={closePicker} position='bottom'>
        <div className='p-3'>{picker}</div>
      </PickerDrawer>
    </div>
  )
}
