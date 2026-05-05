import type {ReactNode} from 'react'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'

export function DatabaseLayout({children}: {children: ReactNode}) {
  return (
    <section className='space-y-2.5 sm:space-y-3'>
      <div className='flex items-start gap-2.5 rounded-sm border border-amber-400/20 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(69,26,3,0.12))] px-2.5 py-2 sm:items-center sm:gap-3 sm:px-3 sm:py-2.5'>
        <img
          alt=''
          aria-hidden
          className='h-9 w-9 shrink-0 -scale-x-100 object-contain sm:h-12 sm:w-12'
          src={emojiWke}
        />
        <p className='text-xs leading-normal text-amber-100/75'>
          <strong className='font-semibold text-amber-200/90'>Database beta:</strong> Search,
          filters, and detail views are live. We&apos;re still filling in data and polishing the UI,
          so some entries and interactions may shift.
        </p>
      </div>

      {children}
    </section>
  )
}
