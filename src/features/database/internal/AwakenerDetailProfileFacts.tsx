import type {AwakenerProfile} from '@/domain/awakeners-full'

interface AwakenerDetailProfileFactsProps {
  profile: AwakenerProfile | null | undefined
  compact?: boolean
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

export function AwakenerDetailProfileFacts({compact, profile}: AwakenerDetailProfileFactsProps) {
  const facts = buildProfileFacts(profile)

  if (facts.length === 0) {
    return null
  }

  return (
    <div className='border border-slate-600/30 bg-slate-900/30 px-3 py-2.5'>
      <dl className={compact ? 'grid grid-cols-2 gap-x-6 gap-y-1.5' : 'space-y-1'}>
        {facts.map((fact) => (
          <div className='flex items-baseline justify-between gap-3 text-[11px]' key={fact.label}>
            <dt className='text-slate-500'>{fact.label}</dt>
            <dd className='text-right font-medium text-slate-200'>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
