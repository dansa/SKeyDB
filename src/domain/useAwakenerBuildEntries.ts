import {useState} from 'react'

import {getAwakenerBuildEntries, type AwakenerBuildEntry} from './awakener-builds'

export function useAwakenerBuildEntries(): AwakenerBuildEntry[] | null {
  const [entries] = useState<AwakenerBuildEntry[] | null>(() => getAwakenerBuildEntries())

  return entries
}
