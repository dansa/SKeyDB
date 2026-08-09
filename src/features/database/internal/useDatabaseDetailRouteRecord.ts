import {useCallback, useEffect, useState} from 'react'

import {useLocation, useNavigate} from 'react-router'

type DatabaseDetailRecordLoader<TRecord> = (id: string) => Promise<TRecord | undefined>

interface UseDatabaseDetailRouteRecordOptions<TRecord> {
  id: string
  loadRecord: DatabaseDetailRecordLoader<TRecord>
  missingPathname: string
}

interface UseDatabaseDetailRecordOptions<TRecord> {
  id: string
  loadRecord: DatabaseDetailRecordLoader<TRecord>
  onMissingRecord?: () => void
}

interface DatabaseDetailRecordState<TRecord> {
  error: Error | null
  id: string
  isLoading: boolean
  loadRecord: DatabaseDetailRecordLoader<TRecord>
  record: TRecord | null
}

function normalizeDatabaseDetailRecordError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Database detail record load failed')
}

const recordCacheByLoader = new WeakMap<DatabaseDetailRecordLoader<unknown>, Map<string, unknown>>()
const pendingRecordLoadsByLoader = new WeakMap<
  DatabaseDetailRecordLoader<unknown>,
  Map<string, Promise<unknown>>
>()
const trackedRecordCaches = new Set<Map<string, unknown>>()
const trackedPendingRecordLoads = new Set<Map<string, Promise<unknown>>>()

function getRecordCache<TRecord>(
  loadRecord: DatabaseDetailRecordLoader<TRecord>,
): Map<string, TRecord | null> {
  let cache = recordCacheByLoader.get(loadRecord)
  if (!cache) {
    cache = new Map()
    recordCacheByLoader.set(loadRecord, cache)
    trackedRecordCaches.add(cache)
  }
  return cache as Map<string, TRecord | null>
}

function getPendingRecordLoads<TRecord>(
  loadRecord: DatabaseDetailRecordLoader<TRecord>,
): Map<string, Promise<TRecord | undefined>> {
  let pendingLoads = pendingRecordLoadsByLoader.get(loadRecord)
  if (!pendingLoads) {
    pendingLoads = new Map()
    pendingRecordLoadsByLoader.set(loadRecord, pendingLoads)
    trackedPendingRecordLoads.add(pendingLoads)
  }
  return pendingLoads as Map<string, Promise<TRecord | undefined>>
}

function loadAndCacheDatabaseDetailRecord<TRecord>({
  id,
  loadRecord,
}: Pick<UseDatabaseDetailRecordOptions<TRecord>, 'id' | 'loadRecord'>) {
  const recordCache = getRecordCache<TRecord>(loadRecord)
  const pendingLoads = getPendingRecordLoads<TRecord>(loadRecord)
  const cacheKey = id
  const pendingLoad = pendingLoads.get(cacheKey)
  if (pendingLoad) {
    return pendingLoad
  }

  let recordLoad: Promise<TRecord | undefined>
  try {
    recordLoad = loadRecord(id)
  } catch (error) {
    recordLoad = Promise.reject(normalizeDatabaseDetailRecordError(error))
  }
  const loadPromise = recordLoad.then(
    (nextRecord) => {
      recordCache.set(cacheKey, nextRecord ?? null)
      pendingLoads.delete(cacheKey)
      return nextRecord
    },
    (error: unknown) => {
      pendingLoads.delete(cacheKey)
      throw error
    },
  )
  pendingLoads.set(cacheKey, loadPromise)
  return loadPromise
}

export async function preloadDatabaseDetailRecord<TRecord>({
  id,
  loadRecord,
}: Pick<UseDatabaseDetailRecordOptions<TRecord>, 'id' | 'loadRecord'>): Promise<void> {
  const cache = getRecordCache<TRecord>(loadRecord)
  const cacheKey = id
  if (cache.has(cacheKey)) {
    return
  }

  await loadAndCacheDatabaseDetailRecord({id, loadRecord})
}

export function clearDatabaseDetailRecordCacheForTests() {
  for (const cache of trackedRecordCaches) {
    cache.clear()
  }
  for (const pendingLoads of trackedPendingRecordLoads) {
    pendingLoads.clear()
  }
}

export function useDatabaseDetailRecord<TRecord>({
  id,
  loadRecord,
  onMissingRecord,
}: UseDatabaseDetailRecordOptions<TRecord>) {
  const recordCache = getRecordCache<TRecord>(loadRecord)
  const initialCacheKey = id
  const initialCachedRecord = recordCache.get(initialCacheKey)
  const [retryVersion, setRetryVersion] = useState(0)
  const [state, setState] = useState<DatabaseDetailRecordState<TRecord>>(() => ({
    error: null,
    id,
    isLoading: !recordCache.has(initialCacheKey),
    loadRecord,
    record: initialCachedRecord ?? null,
  }))

  const retry = useCallback(() => {
    recordCache.delete(id)
    setState({error: null, id, isLoading: true, loadRecord, record: null})
    setRetryVersion((currentVersion) => currentVersion + 1)
  }, [id, loadRecord, recordCache])

  useEffect(() => {
    let isCancelled = false
    const cacheKey = id
    if (recordCache.has(cacheKey)) {
      const cachedRecord = recordCache.get(cacheKey) ?? null
      if (!cachedRecord) {
        onMissingRecord?.()
      }
      return undefined
    }

    void loadAndCacheDatabaseDetailRecord({id, loadRecord}).then(
      (nextRecord) => {
        if (isCancelled) {
          return
        }

        setState({
          error: null,
          id,
          isLoading: false,
          loadRecord,
          record: nextRecord ?? null,
        })

        if (!nextRecord) {
          onMissingRecord?.()
        }
      },
      (error: unknown) => {
        if (!isCancelled) {
          setState({
            error: normalizeDatabaseDetailRecordError(error),
            id,
            isLoading: false,
            loadRecord,
            record: null,
          })
        }
      },
    )

    return () => {
      isCancelled = true
    }
  }, [id, loadRecord, onMissingRecord, recordCache, retryVersion])

  if (state.id !== id || state.loadRecord !== loadRecord) {
    const cacheKey = id
    if (recordCache.has(cacheKey)) {
      return {
        error: null,
        isLoading: false,
        record: recordCache.get(cacheKey) ?? null,
        retry,
      }
    }
    return {error: null, isLoading: true, record: null, retry}
  }

  return {
    error: state.error,
    isLoading: state.isLoading,
    record: state.record,
    retry,
  }
}

export function useDatabaseDetailRouteRecord<TRecord>({
  id,
  loadRecord,
  missingPathname,
}: UseDatabaseDetailRouteRecordOptions<TRecord>) {
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
