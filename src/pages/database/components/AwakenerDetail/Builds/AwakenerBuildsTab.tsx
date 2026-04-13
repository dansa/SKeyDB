import {useMemo} from 'react'

import {getAwakenerBuildEntryById} from '@/domain/awakener-builds'
import {useAwakenerBuildEntries} from '@/domain/useAwakenerBuildEntries'

import {DatabaseTab} from '../../DatabaseMain'
import {AwakenerBuildCard} from './AwakenerBuildsTabSections'

interface AwakenerBuildsTabProps {
  awakenerId: number
}

export function AwakenerBuildsTab({awakenerId}: AwakenerBuildsTabProps) {
  const entries = useAwakenerBuildEntries()

  const entry = useMemo(() => {
    return entries ? getAwakenerBuildEntryById(awakenerId, entries) : undefined
  }, [awakenerId, entries])

  if (!entries) {
    return <p className='py-4 text-xs text-slate-400'>Loading...</p>
  }

  if (!entry) {
    return <p className='py-4 text-xs text-slate-400'>No curated builds available yet.</p>
  }

  const showBuildLabels = entry.builds.length > 1

  return (
    <DatabaseTab>
      {entry.builds.map((build) => (
        <AwakenerBuildCard
          build={build}
          collapsible={showBuildLabels}
          key={build.id}
          showLabel={showBuildLabels}
        />
      ))}
    </DatabaseTab>
  )
}
