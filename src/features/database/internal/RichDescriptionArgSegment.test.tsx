import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import vortice from '@/data/public-v3/records/derived-skills/derived.vortice.vortex-shell.json'
import salvador from '@/data/public-v3/records/skills/skill.salvador.end-of-suffering.json'
import {publicDescriptionArgSchema} from '@/domain/public-description-args.schema'

import {RichDescriptionArgSegment} from './RichDescriptionArgSegment'
import {RichSegmentRenderer} from './RichSegmentRenderer'

describe('Float description rendering', () => {
  it.each(['inline', 'popover'] as const)(
    'passes Vortice Float semantics through the %s renderer',
    (variant) => {
      const arg = publicDescriptionArgSchema.parse(vortice.upgrades[0].patch.descriptionArgs.Arg3)
      render(
        <RichSegmentRenderer
          segment={{type: 'descriptionArg', argKey: 'Arg3', channel: 'Float'}}
          descriptionArgs={{Arg3: arg}}
          skillLevel={1}
          stats={{
            CON: '100',
            ATK: '100',
            DEF: '100',
            CritRate: '0%',
            CritDamage: '0%',
            AliemusRegen: '0',
            KeyflareRegen: '0',
            RealmMastery: '101',
            SigilYield: '0%',
            DamageAmplification: '0%',
            DeathResistance: '0%',
          }}
          variant={variant}
        />,
      )
      expect(screen.getByText('1.005%')).toHaveAttribute('title', '0.5% + Realm Mastery × 0.005%')
    },
  )
  it.each(['inline', 'popover'] as const)(
    'renders precise Salvador values and tooltips in %s',
    (variant) => {
      const arg = publicDescriptionArgSchema.parse(salvador.descriptionArgs.Arg2)
      const {rerender} = render(
        <RichDescriptionArgSegment
          arg={arg}
          channel='Float'
          rank={1}
          maxRank={6}
          formulaContext={undefined}
          showVisibleScaling
          stats={null}
          variant={variant}
        />,
      )
      expect(screen.getByText('0.75')).toHaveAttribute(
        'title',
        'Lv1: 0.75\nLv2: 0.8\nLv3: 0.85\nLv4: 0.9\nLv5: 0.95\nLv6: 1',
      )
      rerender(
        <RichDescriptionArgSegment
          arg={arg}
          channel='Float'
          rank={3}
          maxRank={6}
          formulaContext={undefined}
          showVisibleScaling
          stats={null}
          variant={variant}
        />,
      )
      expect(screen.getByText('0.85')).toBeInTheDocument()
    },
  )
})
