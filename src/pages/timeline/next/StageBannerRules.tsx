import {StageDisclosure} from './StageDisclosure'

type RuleProfile = 'awakener' | 'wheel' | 'kaleido' | 'oathbound-oracle' | 'myriad-self-select'

export function StageBannerRules({profiles}: {profiles: RuleProfile[]}) {
  const mixed = profiles.includes('kaleido') || profiles.includes('myriad-self-select')
  const selector = profiles.includes('myriad-self-select')
  const daily = profiles.includes('oathbound-oracle')
  const kinds = profiles.filter(
    (profile): profile is 'awakener' | 'wheel' => profile === 'awakener' || profile === 'wheel',
  )
  return (
    <StageDisclosure label='Rules & Rates'>
      <p className='pt-2 text-xs text-slate-400'>
        Only SSRs are listed. SR and R Wheels can also drop.
      </p>
      <ul className='timeline-next-prose space-y-2 py-2 text-slate-300 tabular-nums'>
        <li>
          SSR rate per pull: 3.03% base; 5.02% including guarantees. An SSR is guaranteed within 30
          pulls.
        </li>
        {mixed ? (
          <>
            <li>
              When an SSR drops, it has a 33.33% chance to be an Awakener before the type guarantee.
            </li>
            <li>
              After two consecutive SSRs of the same kind, the next SSR is guaranteed to be the
              other kind.
            </li>
            <li>
              Pity is shared within {selector ? 'Myriad Self-Select' : 'Kaleido Recollections'}{' '}
              Awakenings and is separate from other banner types.
            </li>
            <li>A discounted daily single costs 60 Silver Prime and gives 60 Silver as a bonus.</li>
          </>
        ) : daily ? (
          <>
            <li>
              Before guarantees, an SSR has a 33.33% chance to be one of the two daily rate-ups.
            </li>
            <li>
              After an off-banner SSR, the next SSR is guaranteed to be one of the daily rate-ups.
            </li>
            <li>
              After two consecutive rate-up results of the same kind, the next rate-up is guaranteed
              to be the other kind.
            </li>
            <li>Pity carries between daily rotations and is separate from other banner types.</li>
          </>
        ) : null}
      </ul>
      {kinds.map((kind) => (
        <div key={kind}>
          {kinds.length > 1 ? (
            <h4 className='mt-2 text-sm font-semibold text-[var(--ui-text-main)]'>
              {kind === 'wheel' ? 'Wheel Awakening' : 'Character Awakening'}
            </h4>
          ) : null}
          <ul className='timeline-next-prose space-y-2 py-2 text-slate-300 tabular-nums'>
            <li>
              When an SSR drops, it has a {kind === 'wheel' ? '50%' : '33.33%'} chance to be the
              rate-up before the featured guarantee.
            </li>
            <li>
              {kind === 'wheel'
                ? 'After one off-banner SSR, the next SSR is guaranteed to be the rate-up.'
                : 'After two consecutive off-banner SSRs, the next SSR is guaranteed to be the rate-up.'}
            </li>
            <li>
              Pity carries between {kind === 'wheel' ? 'Wheel of Destiny' : 'Character'} Event
              Awakenings and is separate from other banner types.
            </li>
          </ul>
        </div>
      ))}
    </StageDisclosure>
  )
}
