import {useCallback, useEffect, useState} from 'react'

import {useLocation, useNavigate} from 'react-router-dom'

interface UseDatabaseDetailRouteRecordOptions<TId, TRecord> {
  id: TId
  loadRecord: (id: TId) => Promise<TRecord | undefined>
  missingPathname: string
}

interface UseDatabaseDetailRecordOptions<TId, TRecord> {
  id: TId
  loadRecord: (id: TId) => Promise<TRecord | undefined>
  onMissingRecord?: () => void
}

export function useDatabaseDetailRecord<TId, TRecord>({
  id,
  loadRecord,
  onMissingRecord,
}: UseDatabaseDetailRecordOptions<TId, TRecord>) {
  const [state, setState] = useState<{
    id: TId
    isLoading: boolean
    record: TRecord | null
  }>(() => ({
    id,
    isLoading: true,
    record: null,
  }))

  useEffect(() => {
    let isCancelled = false

    void loadRecord(id).then((nextRecord) => {
      if (isCancelled) {
        return
      }

      setState({
        id,
        isLoading: false,
        record: nextRecord ?? null,
      })

      if (!nextRecord) {
        onMissingRecord?.()
      }
    })

    return () => {
      isCancelled = true
    }
  }, [id, loadRecord, onMissingRecord])

  if (state.id !== id) {
    return {isLoading: true, record: null}
  }

  return {
    isLoading: state.isLoading,
    record: state.record,
  }
}

export function useDatabaseDetailRouteRecord<TId, TRecord>({
  id,
  loadRecord,
  missingPathname,
}: UseDatabaseDetailRouteRecordOptions<TId, TRecord>) {
  const location = useLocation()
  const navigate = useNavigate()
  const onMissingRecord = useCallback(() => {
    void navigate(
      {
        pathname: missingPathname,
        search: location.search,
      },
      {replace: true},
    )
  }, [location.search, missingPathname, navigate])

  return useDatabaseDetailRecord({id, loadRecord, onMissingRecord})
}
