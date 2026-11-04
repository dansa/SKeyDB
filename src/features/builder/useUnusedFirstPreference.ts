import {useEffect, useState} from 'react'

import {safeStorageRead, safeStorageWrite, type StorageLike} from '@/domain/storage'

const UNUSED_FIRST_KEY = 'skeydb.builder.unusedFirst.v1'

export function useUnusedFirstPreference(storage: StorageLike | null) {
  const [unusedFirst, setUnusedFirst] = useState(
    () => safeStorageRead(storage, UNUSED_FIRST_KEY) === '1',
  )
  useEffect(() => {
    safeStorageWrite(storage, UNUSED_FIRST_KEY, unusedFirst ? '1' : '0')
  }, [storage, unusedFirst])
  return {unusedFirst, setUnusedFirst}
}
