import type {ReactNode} from 'react'

export function DatabaseLayout({children}: {children: ReactNode}) {
  return (
    <section aria-label='Database' className='space-y-3 sm:space-y-4'>
      {children}
    </section>
  )
}
