import {useState} from 'react'

import {Link} from 'react-router'

import {
  getBrowserLocalStorage,
  safeStorageRead,
  safeStorageWrite,
  type StorageLike,
} from '@/domain/storage'

import {isDomainMigrationNoticeLaunchEnabled} from './domainMigrationNoticeLaunch'

interface DomainMigrationNoticeProps {
  storage?: StorageLike | null
  locationLike?: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port' | 'pathname'>
  routePathname: string
  allowLocalOrigins?: boolean
  enabled?: boolean
}

const SOURCE_NOTICE_DISMISS_KEY = 'skeydb.domainMoveNotice.source.dismissed.v1'
const TARGET_NOTICE_DISMISS_KEY = 'skeydb.domainMoveNotice.target.dismissed.v1'
const SOURCE_ORIGIN = 'https://dansa.github.io'
const TARGET_ORIGINS = ['https://skeydb.com', 'https://www.skeydb.com']
const PRIMARY_TARGET_ORIGIN = TARGET_ORIGINS[0]
const BUILDER_STORAGE_KEYS = ['skeydb.builder.v2', 'skeydb.builder.v1']
const COLLECTION_STORAGE_KEYS = ['skeydb.collection.v2', 'skeydb.collection.v1']

type DomainMigrationNoticeModel =
  | {
      kind: 'source-transfer'
      dismissKey: typeof SOURCE_NOTICE_DISMISS_KEY
    }
  | {
      kind: 'source-info'
      dismissKey: typeof SOURCE_NOTICE_DISMISS_KEY
    }
  | {
      kind: 'target-transfer'
      dismissKey: typeof TARGET_NOTICE_DISMISS_KEY
    }

export function DomainMigrationNotice({
  storage = getBrowserLocalStorage(),
  locationLike = window.location,
  routePathname,
  allowLocalOrigins = import.meta.env.DEV,
  enabled = isDomainMigrationNoticeLaunchEnabled(),
}: DomainMigrationNoticeProps) {
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => new Set())
  const notice = enabled
    ? resolveDomainMigrationNotice({
        allowLocalOrigins,
        locationLike,
        routePathname,
        storage,
      })
    : null

  if (
    !notice ||
    dismissedKeys.has(notice.dismissKey) ||
    safeStorageRead(storage, notice.dismissKey) === '1'
  ) {
    return null
  }

  const dismissNotice = () => {
    safeStorageWrite(storage, notice.dismissKey, '1')
    setDismissedKeys((current) => new Set(current).add(notice.dismissKey))
  }

  return (
    <section
      aria-label='Domain move notice'
      className='mx-auto mt-3 flex w-[calc(100%-2rem)] max-w-[1240px] flex-col gap-3 border border-cyan-300/25 bg-slate-950/80 px-3 py-3 text-sm text-slate-200 shadow-lg shadow-slate-950/30 sm:flex-row sm:items-center sm:justify-between sm:px-4'
    >
      <DomainMigrationNoticeCopy notice={notice} />
      <div className='flex flex-wrap items-center gap-2'>
        <DomainMigrationNoticeAction notice={notice} />
        <button
          aria-label='Dismiss domain move notice'
          className='rounded border border-slate-600 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200'
          onClick={dismissNotice}
          type='button'
        >
          Not now
        </button>
      </div>
    </section>
  )
}

function DomainMigrationNoticeCopy({notice}: {notice: DomainMigrationNoticeModel}) {
  if (notice.kind === 'source-transfer') {
    return (
      <p className='m-0 max-w-3xl text-left leading-5'>
        <strong className='text-cyan-100'>SKeyDB now lives at skeydb.com.</strong> This browser has
        saved builder or collection data you can bring over when you are ready.
      </p>
    )
  }

  if (notice.kind === 'source-info') {
    return (
      <p className='m-0 max-w-3xl text-left leading-5'>
        <strong className='text-cyan-100'>SKeyDB now lives at skeydb.com.</strong> This GitHub Pages
        address will keep working for compatibility.
      </p>
    )
  }

  return (
    <p className='m-0 max-w-3xl text-left leading-5'>
      <strong className='text-cyan-100'>Used SKeyDB before on GitHub Pages?</strong> You can bring
      over saved builder and collection data from that browser.
    </p>
  )
}

function DomainMigrationNoticeAction({notice}: {notice: DomainMigrationNoticeModel}) {
  const actionClassName =
    'rounded border border-cyan-300/45 bg-cyan-300/15 px-3 py-1.5 text-xs font-semibold text-cyan-50 hover:bg-cyan-300/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200'

  if (notice.kind === 'source-transfer') {
    return (
      <a className={actionClassName} href={`${PRIMARY_TARGET_ORIGIN}/#/migrate`}>
        Move saved data
      </a>
    )
  }

  if (notice.kind === 'source-info') {
    return (
      <a className={actionClassName} href={PRIMARY_TARGET_ORIGIN}>
        Open skeydb.com
      </a>
    )
  }

  return (
    <Link className={actionClassName} to='/migrate'>
      Transfer saved data
    </Link>
  )
}

function resolveDomainMigrationNotice({
  storage,
  locationLike,
  routePathname,
  allowLocalOrigins,
}: {
  storage: StorageLike | null
  locationLike: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port' | 'pathname'>
  routePathname: string
  allowLocalOrigins: boolean
}): DomainMigrationNoticeModel | null {
  if (routePathname === '/migrate' || routePathname.startsWith('/migrate/')) {
    return null
  }

  const hasSavedData = hasTransferableBuilderOrCollectionData(storage)
  if (isMigrationSourceOrigin(locationLike, allowLocalOrigins)) {
    return {
      kind: hasSavedData ? 'source-transfer' : 'source-info',
      dismissKey: SOURCE_NOTICE_DISMISS_KEY,
    }
  }

  if (isMigrationTargetOrigin(locationLike, allowLocalOrigins) && !hasSavedData) {
    return {kind: 'target-transfer', dismissKey: TARGET_NOTICE_DISMISS_KEY}
  }

  return null
}

function hasTransferableBuilderOrCollectionData(storage: StorageLike | null): boolean {
  return [...BUILDER_STORAGE_KEYS, ...COLLECTION_STORAGE_KEYS].some((key) =>
    looksLikeVersionedStorageEnvelope(safeStorageRead(storage, key)),
  )
}

function looksLikeVersionedStorageEnvelope(raw: string | null): boolean {
  if (!raw) {
    return false
  }

  try {
    const parsed = JSON.parse(raw) as {version?: unknown; payload?: unknown}
    return (
      (parsed.version === 1 || parsed.version === 2) &&
      !!parsed.payload &&
      typeof parsed.payload === 'object' &&
      !Array.isArray(parsed.payload)
    )
  } catch {
    return false
  }
}

function isMigrationSourceOrigin(
  locationLike: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>,
  allowLocalOrigins: boolean,
): boolean {
  if (locationLike.origin === SOURCE_ORIGIN) {
    return true
  }
  return allowLocalOrigins && isLocalHttpOrigin(locationLike) && locationLike.port === '5173'
}

function isMigrationTargetOrigin(
  locationLike: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>,
  allowLocalOrigins: boolean,
): boolean {
  if (TARGET_ORIGINS.includes(locationLike.origin)) {
    return true
  }
  return allowLocalOrigins && isLocalHttpOrigin(locationLike) && locationLike.port !== '5173'
}

function isLocalHttpOrigin(locationLike: Pick<Location, 'hostname' | 'protocol'>): boolean {
  return (
    (locationLike.protocol === 'http:' || locationLike.protocol === 'https:') &&
    (locationLike.hostname === 'localhost' ||
      locationLike.hostname === '127.0.0.1' ||
      locationLike.hostname === '[::1]')
  )
}
