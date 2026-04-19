import {useEffect, useState} from 'react'

import {useLocation, useNavigate} from 'react-router-dom'

interface UseDatabaseDetailRouteRecordOptions<TId, TRecord> {
  id: TId
  loadRecord: (id: TId) => Promise<TRecord | undefined>
  missingPathname: string
}

export function useDatabaseDetailRouteRecord<TId, TRecord>({
  id,
  loadRecord,
  missingPathname,
}: UseDatabaseDetailRouteRecordOptions<TId, TRecord>) {
  const location = useLocation()
  const navigate = useNavigate()
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

      if (nextRecord) {
        setState({
          id,
          isLoading: false,
          record: nextRecord,
        })
        return
      }

      setState({
        id,
        isLoading: false,
        record: null,
      })
      void navigate(
        {
          pathname: missingPathname,
          search: location.search,
        },
        {replace: true},
      )
    })

    return () => {
      isCancelled = true
    }
  }, [id, loadRecord, location.search, missingPathname, navigate])

  if (state.id !== id) {
    return {isLoading: true, record: null}
  }

  return {
    isLoading: state.isLoading,
    record: state.record,
  }
}
