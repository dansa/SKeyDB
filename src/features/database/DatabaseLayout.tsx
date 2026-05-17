import type {ReactNode} from 'react'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'

export function DatabaseLayout({children}: {children: ReactNode}) {
  return (
    <section className='space-y-3 sm:space-y-4'>
      <div
        aria-label='Database status'
        className='relative isolate flex items-start gap-2.5 overflow-hidden rounded-[2px] border border-slate-700/55 bg-[linear-gradient(180deg,rgba(11,20,35,0.82),rgba(5,12,23,0.72))] px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] sm:items-center sm:gap-3 sm:px-3.5 sm:py-2.5'
        role='note'
      >
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-y-0 left-0 -z-10 w-28 bg-[radial-gradient(circle_at_28%_48%,rgba(251,191,36,0.13),transparent_70%)]'
        />
        <img
          alt=''
          aria-hidden
          className='h-8 w-8 shrink-0 -scale-x-100 object-contain drop-shadow-[0_0.35rem_0.85rem_rgba(2,6,14,0.68)] sm:h-10 sm:w-10'
          src={emojiWke}
        />
        <p className='max-w-[78rem] text-xs leading-normal text-slate-300/88'>
          <strong className='font-semibold text-amber-100'>Database beta:</strong> Search, filters,
          and detail views are live. Some data is still being filled in, so entries and interactions
          may shift.
        </p>
      </div>

      {children}
    </section>
  )
}
