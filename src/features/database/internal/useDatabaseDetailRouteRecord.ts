import {useCallback, useEffect, useSyncExternalStore} from 'react'

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

interface DatabaseDetailRecordSnapshot<TRecord> {
  error: Error | null
  record: TRecord | null
  status: 'idle' | 'loading' | 'resolved' | 'rejected'
}

interface DatabaseDetailRecordResource<TRecord> {
  listeners: Set<() => void>
  loadPromise: Promise<TRecord | undefined> | null
  snapshot: DatabaseDetailRecordSnapshot<TRecord>
}

function normalizeDatabaseDetailRecordError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Database detail record load failed')
}

const recordResourcesByLoader = new WeakMap<
  DatabaseDetailRecordLoader<unknown>,
  Map<string, DatabaseDetailRecordResource<unknown>>
>()
const trackedRecordResourceMaps = new Set<Map<string, DatabaseDetailRecordResource<unknown>>>()

function getDatabaseDetailRecordResource<TRecord>(
  loadRecord: DatabaseDetailRecordLoader<TRecord>,
  id: string,
): DatabaseDetailRecordResource<TRecord> {
  let resources = recordResourcesByLoader.get(loadRecord)
  if (!resources) {
    resources = new Map()
    recordResourcesByLoader.set(loadRecord, resources)
    trackedRecordResourceMaps.add(resources)
  }

  let resource = resources.get(id)
  if (!resource) {
    resource = {
      listeners: new Set(),
      loadPromise: null,
      snapshot: {error: null, record: null, status: 'idle'},
    }
    resources.set(id, resource)
  }
  return resource as DatabaseDetailRecordResource<TRecord>
}

function publishDatabaseDetailRecordSnapshot<TRecord>(
  resource: DatabaseDetailRecordResource<TRecord>,
  snapshot: DatabaseDetailRecordSnapshot<TRecord>,
) {
  resource.snapshot = snapshot
  for (const listener of resource.listeners) {
    listener()
  }
}

function loadDatabaseDetailRecordResource<TRecord>({
  id,
  loadRecord,
  resource,
  retry = false,
}: Pick<UseDatabaseDetailRecordOptions<TRecord>, 'id' | 'loadRecord'> & {
  resource: DatabaseDetailRecordResource<TRecord>
  retry?: boolean
}) {
  if (resource.loadPromise) {
    return resource.loadPromise
  }
  if (!retry && resource.snapshot.status === 'resolved') {
    return Promise.resolve(resource.snapshot.record ?? undefined)
  }

  publishDatabaseDetailRecordSnapshot(resource, {error: null, record: null, status: 'loading'})
  let recordLoad: Promise<TRecord | undefined>
  try {
    recordLoad = loadRecord(id)
  } catch (error) {
    recordLoad = Promise.reject(normalizeDatabaseDetailRecordError(error))
  }
  const loadPromise = recordLoad.then(
    (nextRecord) => {
      resource.loadPromise = null
      publishDatabaseDetailRecordSnapshot(resource, {
        error: null,
        record: nextRecord ?? null,
        status: 'resolved',
      })
      return nextRecord
    },
    (error: unknown) => {
      const normalizedError = normalizeDatabaseDetailRecordError(error)
      resource.loadPromise = null
      publishDatabaseDetailRecordSnapshot(resource, {
        error: normalizedError,
        record: null,
        status: 'rejected',
      })
      throw normalizedError
    },
  )
  if (resource.snapshot.status === 'loading') {
    resource.loadPromise = loadPromise
  }
  return loadPromise
}

export async function preloadDatabaseDetailRecord<TRecord>({
  id,
  loadRecord,
}: Pick<UseDatabaseDetailRecordOptions<TRecord>, 'id' | 'loadRecord'>): Promise<void> {
  const resource = getDatabaseDetailRecordResource(loadRecord, id)
  await loadDatabaseDetailRecordResource({id, loadRecord, resource})
}

export function clearDatabaseDetailRecordCacheForTests() {
  for (const resources of trackedRecordResourceMaps) {
    resources.clear()
  }
}

export function useDatabaseDetailRecord<TRecord>({
  id,
  loadRecord,
  onMissingRecord,
}: UseDatabaseDetailRecordOptions<TRecord>) {
  const resource = getDatabaseDetailRecordResource(loadRecord, id)
  const subscribe = useCallback(
    (listener: () => void) => {
      resource.listeners.add(listener)
      return () => {
        resource.listeners.delete(listener)
      }
    },
    [resource],
  )
  const getSnapshot = useCallback(() => resource.snapshot, [resource])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const retry = useCallback(() => {
    void loadDatabaseDetailRecordResource({id, loadRecord, resource, retry: true}).catch(
      () => undefined,
    )
  }, [id, loadRecord, resource])

  useEffect(() => {
    if (resource.snapshot.status === 'idle') {
      void loadDatabaseDetailRecordResource({id, loadRecord, resource}).catch(() => undefined)
    }
  }, [id, loadRecord, resource])

  useEffect(() => {
    if (snapshot.status === 'resolved' && !snapshot.record) {
      onMissingRecord?.()
    }
  }, [onMissingRecord, snapshot.record, snapshot.status])

  return {
    error: snapshot.error,
    isLoading: snapshot.status === 'idle' || snapshot.status === 'loading',
    record: snapshot.record,
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
