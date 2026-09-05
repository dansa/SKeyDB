import type {AwakenerProfile} from '@/domain/awakeners-full'

import {scaledTypographyStyle} from './font-scale'

interface AwakenerDetailProfileFactsProps {
  profile: AwakenerProfile | null | undefined
  releaseDate?: string
  compact?: boolean
  scaleWithContent?: boolean
}

function buildProfileFacts(profile: AwakenerProfile | null | undefined) {
  return [
    {label: 'Birthday', value: profile?.birthday},
    {label: 'Gender', value: profile?.gender},
    {label: 'Height', value: profile?.height},
    {label: 'Weight', value: profile?.weight},
    {label: 'Gnostic Index', value: profile?.gnosticIndex},
    {label: 'Faction', value: profile?.faction},
  ].filter((fact): fact is {label: string; value: string} => Boolean(fact.value))
}

export function AwakenerDetailProfileFacts({
  compact,
  releaseDate,
  profile,
  scaleWithContent = false,
}: AwakenerDetailProfileFactsProps) {
  const facts = buildProfileFacts(profile)

  const date = releaseDate ? new Date(`${releaseDate}T00:00:00Z`) : null
  const released =
    date && Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(date)
      : null

  if (facts.length === 0 && !released) {
    return null
  }

  return (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <dl className={compact ? 'grid grid-cols-2 gap-x-6 gap-y-1.5' : 'space-y-1'}>
        {facts.map((fact) => (
          <div
            className='flex items-baseline justify-between gap-3 text-[11px] leading-4'
            style={scaleWithContent ? scaledTypographyStyle(11, 16) : undefined}
            key={fact.label}
          >
            <dt className='text-slate-500'>{fact.label}</dt>
            <dd className='text-right font-medium text-slate-200'>{fact.value}</dd>
          </div>
        ))}
        {released ? (
          <div
            className={`flex items-baseline justify-between gap-3 text-[11px] leading-4 ${compact ? 'col-span-2' : ''} ${facts.length ? 'mt-2 border-t border-slate-600/30 pt-2' : ''}`}
            style={scaleWithContent ? scaledTypographyStyle(11, 16) : undefined}
          >
            <dt className='text-slate-500'>Released</dt>
            <dd className='text-right font-medium text-slate-200'>
              <time dateTime={releaseDate}>{released}</time>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
