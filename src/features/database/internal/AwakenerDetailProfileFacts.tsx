import type {ReactNode} from 'react'

import type {AwakenerProfile} from '@/domain/awakeners-full'

import {scaledTypographyStyle} from './font-scale'

const releaseDateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

interface AwakenerDetailProfileFactsProps {
  profile: AwakenerProfile | null | undefined
  releaseDate?: string
  compact?: boolean
  scaleWithContent?: boolean
}

interface ProfileFact {
  label: string
  value: ReactNode
  metadata?: boolean
  separated?: boolean
}

function formatReleaseDate(releaseDate?: string) {
  if (!releaseDate) return null
  const date = new Date(`${releaseDate}T00:00:00Z`)
  return Number.isFinite(date.getTime()) ? releaseDateFormatter.format(date) : null
}

function buildProfileFacts(
  profile: AwakenerProfile | null | undefined,
  releaseDate?: string,
): ProfileFact[] {
  const facts: ProfileFact[] = [
    {label: 'Birthday', value: profile?.birthday},
    {label: 'Gender', value: profile?.gender},
    {label: 'Height', value: profile?.height},
    {label: 'Weight', value: profile?.weight},
    {label: 'Gnostic Index', value: profile?.gnosticIndex},
    {label: 'Faction', value: profile?.faction},
  ].filter((fact) => Boolean(fact.value))
  const hasProfileFacts = facts.length > 0
  if (profile?.voiceActor) {
    facts.push({
      label: 'Voice Actor',
      value: profile.voiceActor,
      metadata: true,
      separated: hasProfileFacts,
    })
  }
  const released = formatReleaseDate(releaseDate)
  if (released) {
    facts.push({
      label: 'Released',
      value: <time dateTime={releaseDate}>{released}</time>,
      metadata: true,
      separated: hasProfileFacts && !profile?.voiceActor,
    })
  }
  return facts
}

export function AwakenerDetailProfileFacts({
  compact,
  releaseDate,
  profile,
  scaleWithContent = false,
}: AwakenerDetailProfileFactsProps) {
  const facts = buildProfileFacts(profile, releaseDate)
  const style = scaleWithContent ? scaledTypographyStyle(11, 16) : undefined
  if (!facts.length) return null
  return (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <dl className={compact ? 'grid grid-cols-2 gap-x-6 gap-y-1.5' : 'space-y-1'}>
        {facts.map((fact) => (
          <div
            key={fact.label}
            style={style}
            className={`flex items-baseline justify-between gap-3 text-[11px] leading-4 ${compact && fact.metadata ? 'col-span-2' : ''} ${fact.separated ? 'mt-2 border-t border-slate-600/30 pt-2' : ''}`}
          >
            <dt className={`text-slate-500 ${fact.metadata ? 'shrink-0' : ''}`}>{fact.label}</dt>
            <dd className='text-right font-medium text-slate-200'>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
