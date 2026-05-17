import {useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction} from 'react'

import {FaArrowRight, FaCircleCheck, FaClipboard, FaHouse} from 'react-icons/fa6'

import {getBrowserLocalStorage, type StorageLike} from '@/domain/storage'
import {
  createLegacyMigrationExportUrl,
  createMigrationNonce,
  DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS,
  isAllowedMigrationSourceOrigin,
  isAllowedMigrationTargetOrigin,
  parseMigrationBridgeMessage,
  PRIMARY_MIGRATION_TARGET_URL,
  resolveLegacyMigrationExportUrlForCurrentOrigin,
} from '@/domain/storage-migration/migrationBridgeProtocol'
import {
  applyDomainStorageMigrationPlan,
  planDomainStorageMigration,
  type DomainStorageMigrationDecision,
  type DomainStorageMigrationPlan,
  type DomainStorageMigrationPlanItem,
} from '@/domain/storage-migration/migrationImportPolicy'

interface MigrationReceivePageProps {
  storage?: StorageLike | null
  locationLike?: Pick<Location, 'origin' | 'hostname' | 'protocol' | 'port'>
  openWindow?: (url: string, target: string) => unknown
  createNonce?: () => string
  allowLocalOrigins?: boolean
  configuredLegacyExportUrl?: string
}

type ReceiveStatus = 'idle' | 'waiting' | 'ready' | 'complete' | 'error'

const PRIMARY_ACTION_CLASS =
  'inline-flex items-center gap-2 rounded border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25'
const SECONDARY_ACTION_CLASS =
  'inline-flex items-center gap-2 rounded border border-slate-500 bg-slate-800/70 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50'
const SUCCESS_ACTION_CLASS =
  'inline-flex items-center gap-2 rounded border border-emerald-300/50 bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/25'

const TRANSFER_STEPS = [
  'SKeyDB opens your old GitHub Pages save in a second tab.',
  'GitHub Pages sends your saved data back here.',
  'Review what will be moved, then finish the transfer.',
]

export function MigrationReceivePage({
  storage = getBrowserLocalStorage(),
  locationLike = window.location,
  openWindow = (url, target) => window.open(url, target),
  createNonce = createMigrationNonce,
  allowLocalOrigins = import.meta.env.DEV,
  configuredLegacyExportUrl = getConfiguredLegacyExportUrl(),
}: MigrationReceivePageProps) {
  const [status, setStatus] = useState<ReceiveStatus>('idle')
  const [nonce, setNonce] = useState<string | null>(null)
  const [plan, setPlan] = useState<DomainStorageMigrationPlan | null>(null)
  const [copyConflictKeys, setCopyConflictKeys] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [manualPayload, setManualPayload] = useState('')
  const [fallbackExportUrl, setFallbackExportUrl] = useState<string | null>(null)
  const conflictItems = useMemo(
    () => plan?.items.filter((item) => item.status === 'conflict') ?? [],
    [plan],
  )
  const targetOriginAllowed = isAllowedMigrationTargetOrigin(locationLike.origin, {
    allowLocalOrigins,
  })

  const reviewSnapshot = useCallback(
    (snapshot: unknown) => {
      const nextPlan = planDomainStorageMigration(snapshot, storage)
      if (!nextPlan.ok) {
        setPlan(null)
        setCopyConflictKeys(new Set())
        setError('Transfer code is invalid.')
        setStatus('error')
        return
      }
      if (
        !isAllowedMigrationSourceOrigin(nextPlan.snapshot.sourceOrigin, {
          allowLocalOrigins,
        })
      ) {
        setPlan(null)
        setCopyConflictKeys(new Set())
        setError('Transfer code came from an unsupported source.')
        setStatus('error')
        return
      }

      setPlan(nextPlan)
      setError(null)
      setCopyConflictKeys(new Set())
      setStatus('ready')
    },
    [allowLocalOrigins, storage],
  )

  const startTransfer = useCallback(() => {
    const nextNonce = createNonce()
    const legacyExportUrl = resolveLegacyMigrationExportUrlForCurrentOrigin(
      locationLike,
      configuredLegacyExportUrl,
      import.meta.env.DEV,
    )
    const transferUrl = createLegacyMigrationExportUrl({
      nonce: nextNonce,
      targetOrigin: locationLike.origin,
      legacyExportUrl,
    })

    setNonce(nextNonce)
    setStatus('waiting')
    setPlan(null)
    setError(null)
    setCopyConflictKeys(new Set())
    setFallbackExportUrl(transferUrl)
    const openedWindow = openWindow(transferUrl, 'skeydb-domain-migration')
    if (!openedWindow) {
      setNonce(null)
      setError(
        'Could not open the GitHub Pages tab. Use the link below, then paste the transfer code here.',
      )
      setStatus('error')
    }
  }, [configuredLegacyExportUrl, createNonce, locationLike, openWindow])

  useEffect(() => {
    if (!nonce) {
      return
    }

    const handleMessage = (event: MessageEvent) => {
      const message = parseMigrationBridgeMessage(event.data, {
        expectedNonce: nonce,
        eventOrigin: event.origin,
        allowedOrigins: DEFAULT_LEGACY_MIGRATION_SOURCE_ORIGINS,
        allowLocalOrigins,
      })
      if (!message) {
        return
      }

      if (message.type === 'skeydb:migration-error:v1') {
        setError(resolveBridgeErrorMessage(message.error))
        setNonce(null)
        setStatus('error')
        return
      }

      if (message.type !== 'skeydb:migration-snapshot:v1') {
        return
      }

      reviewSnapshot(message.snapshot)
      setNonce(null)
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [allowLocalOrigins, nonce, reviewSnapshot])

  const reviewManualPayload = () => {
    try {
      reviewSnapshot(JSON.parse(manualPayload))
      setNonce(null)
    } catch {
      setPlan(null)
      setCopyConflictKeys(new Set())
      setNonce(null)
      setError('Transfer code is invalid.')
      setStatus('error')
    }
  }

  const applyMigration = () => {
    if (!plan) {
      return
    }

    const decisions = Object.fromEntries(
      conflictItems.map((item) => [
        item.key,
        copyConflictKeys.has(item.key) ? 'copy-source' : 'keep-target',
      ]),
    ) as Record<string, DomainStorageMigrationDecision>
    const result = applyDomainStorageMigrationPlan(plan, storage, decisions)

    if (!result.ok) {
      setError(resolveApplyErrorMessage(result.error, result.key))
      setStatus('error')
      return
    }

    setStatus('complete')
    setNonce(null)
  }

  if (!targetOriginAllowed) {
    return (
      <section className='mx-auto max-w-3xl space-y-5 px-2 py-8 text-slate-100'>
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold'>Start from skeydb.com</h2>
          <p className='text-sm text-slate-300'>
            You are on the old GitHub Pages site. Open the new SKeyDB home first, then start the
            transfer there so your saved data knows where to go.
          </p>
        </div>

        <a className={PRIMARY_ACTION_CLASS} href={PRIMARY_MIGRATION_TARGET_URL}>
          <FaHouse aria-hidden='true' />
          Open skeydb.com
        </a>
      </section>
    )
  }

  return (
    <section className='mx-auto max-w-3xl space-y-5 px-2 py-8 text-slate-100'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>Move your SKeyDB saves</h2>
        <p className='text-sm text-slate-300'>
          Copy your Builder teams, Collection, and settings from GitHub Pages to skeydb.com. Nothing
          is deleted from GitHub Pages.
        </p>
      </div>

      <ol className='grid gap-2 text-sm text-slate-200 sm:grid-cols-3'>
        {TRANSFER_STEPS.map((step, index) => (
          <li className='rounded border border-slate-700 bg-slate-950/35 p-3' key={step}>
            <span className='mb-2 inline-flex size-6 items-center justify-center rounded-full border border-cyan-300/40 text-xs font-semibold text-cyan-100'>
              {index + 1}
            </span>
            <p>{step}</p>
          </li>
        ))}
      </ol>

      <button className={PRIMARY_ACTION_CLASS} onClick={startTransfer} type='button'>
        <FaArrowRight aria-hidden='true' />
        Start transfer
      </button>

      <details className='rounded border border-slate-700 bg-slate-950/25 px-3 py-2 text-sm text-slate-200'>
        <summary className='cursor-pointer font-semibold text-slate-100'>
          Paste a transfer code
        </summary>
        <div className='mt-3 space-y-2'>
          <p className='text-slate-300'>
            Use this only if the GitHub Pages tab shows a code instead of returning here
            automatically.
          </p>
          <label className='block text-sm font-medium text-slate-200' htmlFor='manual-payload'>
            Paste transfer code
          </label>
          <textarea
            className='min-h-28 w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100'
            id='manual-payload'
            onChange={(event) => {
              setManualPayload(event.target.value)
            }}
            value={manualPayload}
          />
          <button
            className={SECONDARY_ACTION_CLASS}
            disabled={!manualPayload.trim()}
            onClick={reviewManualPayload}
            type='button'
          >
            <FaClipboard aria-hidden='true' />
            Review transfer code
          </button>
        </div>
      </details>

      {status === 'waiting' ? (
        <p className='rounded border border-cyan-300/40 bg-cyan-950/25 px-3 py-2 text-sm text-cyan-100'>
          Waiting for the GitHub Pages tab. Keep both tabs open for a moment.
        </p>
      ) : null}

      {error ? (
        <p className='rounded border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100'>
          {error}
        </p>
      ) : null}

      {fallbackExportUrl && (status === 'waiting' || status === 'error') ? (
        <p className='text-sm text-slate-300'>
          <a
            className='font-semibold text-cyan-100 underline decoration-cyan-200/60 underline-offset-4 hover:text-cyan-50'
            href={fallbackExportUrl}
            rel='noreferrer'
            target='_blank'
          >
            Open GitHub Pages transfer page
          </a>
        </p>
      ) : null}

      {plan && status === 'ready' ? (
        <div className='space-y-4'>
          <div className='space-y-1'>
            <h3 className='text-base font-semibold text-slate-100'>Review your transfer</h3>
            <p className='text-sm text-slate-300'>
              These saves will be copied into this browser on skeydb.com.
            </p>
          </div>

          <dl className='grid gap-2 text-sm sm:grid-cols-3'>
            <SummaryItem label='New to this site' value={plan.summary.copy} />
            <SummaryItem label='Already matched' value={plan.summary.unchanged} />
            <SummaryItem label='Needs your choice' value={plan.summary.conflict} />
          </dl>

          {conflictItems.length ? (
            <fieldset className='space-y-3 rounded border border-slate-600 p-3'>
              <legend className='px-1 text-sm font-medium text-slate-200'>
                Choose what to do with existing data
              </legend>
              <p className='text-sm text-slate-300'>
                Some data exists on both sites. Keeping skeydb.com leaves your current data alone.
                Replacing uses the GitHub Pages version and saves a backup first.
              </p>
              <div className='flex flex-wrap gap-2'>
                <button
                  className={SECONDARY_ACTION_CLASS}
                  onClick={() => {
                    setCopyConflictKeys(new Set())
                  }}
                  type='button'
                >
                  Keep existing data
                </button>
                <button
                  className={SECONDARY_ACTION_CLASS}
                  onClick={() => {
                    setCopyConflictKeys(new Set(conflictItems.map((item) => item.key)))
                  }}
                  type='button'
                >
                  Replace all conflicts
                </button>
              </div>
              <div className='space-y-3'>
                {conflictItems.map((item) => (
                  <ConflictChoice
                    copySource={copyConflictKeys.has(item.key)}
                    item={item}
                    key={item.key}
                    setCopyConflictKeys={setCopyConflictKeys}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}

          <button className={SUCCESS_ACTION_CLASS} onClick={applyMigration} type='button'>
            <FaCircleCheck aria-hidden='true' />
            Finish transfer
          </button>
        </div>
      ) : null}

      {status === 'complete' ? (
        <p className='rounded border border-emerald-300/50 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-100'>
          Transfer complete. Refresh SKeyDB if the current view was already open.
        </p>
      ) : null}
    </section>
  )
}

function SummaryItem({label, value}: {label: string; value: number}) {
  return (
    <div className='rounded border border-slate-700 bg-slate-950/40 px-3 py-2'>
      <dt className='text-xs text-slate-400 uppercase'>{label}</dt>
      <dd className='text-lg font-semibold text-slate-100'>{value}</dd>
    </div>
  )
}

function ConflictChoice({
  copySource,
  item,
  setCopyConflictKeys,
}: {
  copySource: boolean
  item: DomainStorageMigrationPlanItem
  setCopyConflictKeys: Dispatch<SetStateAction<Set<string>>>
}) {
  const safeId = createSafeDomId(item.key)
  const keepId = `migration-conflict-keep-${safeId}`
  const replaceId = `migration-conflict-replace-${safeId}`

  const setCopySource = (shouldCopySource: boolean) => {
    setCopyConflictKeys((current) => {
      const next = new Set(current)
      if (shouldCopySource) {
        next.add(item.key)
      } else {
        next.delete(item.key)
      }
      return next
    })
  }

  return (
    <div className='space-y-3 rounded border border-slate-700 bg-slate-950/35 p-3'>
      <div className='space-y-1'>
        <p className='font-medium text-slate-100'>{formatMigrationItemLabel(item)}</p>
        <p className='text-xs text-slate-400'>{formatMigrationItemDescription(item)}</p>
      </div>
      <div className='grid gap-2 text-sm sm:grid-cols-2'>
        <label
          className='flex items-center gap-2 rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-200'
          htmlFor={keepId}
        >
          <input
            checked={!copySource}
            id={keepId}
            name={`migration-conflict-${safeId}`}
            onChange={() => {
              setCopySource(false)
            }}
            type='radio'
          />
          <span>Keep skeydb.com data</span>
        </label>
        <label
          className='flex items-center gap-2 rounded border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-200'
          htmlFor={replaceId}
        >
          <input
            checked={copySource}
            id={replaceId}
            name={`migration-conflict-${safeId}`}
            onChange={() => {
              setCopySource(true)
            }}
            type='radio'
          />
          <span>Replace with GitHub Pages data</span>
        </label>
      </div>
    </div>
  )
}

function createSafeDomId(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, '-')
}

function formatMigrationItemLabel(item: DomainStorageMigrationPlanItem): string {
  if (item.key === 'skeydb.builder.teamPreviewMode.v1') {
    return 'Builder team preview mode'
  }
  if (item.key === 'skeydb.builder.allowDupes.v1') {
    return 'Builder duplicate setting'
  }
  if (item.category === 'builder') {
    return 'Builder teams'
  }
  if (item.category === 'collection') {
    return 'Collection data'
  }
  if (item.category === 'export-config') {
    return 'Export settings'
  }
  return 'SKeyDB setting'
}

function formatMigrationItemDescription(item: DomainStorageMigrationPlanItem): string {
  if (item.category === 'builder') {
    return 'Saved team builder work from the old site.'
  }
  if (item.category === 'collection') {
    return 'Owned awakener and wheel collection data from the old site.'
  }
  if (item.category === 'export-config') {
    return 'Saved image export layout and filter choices.'
  }
  return 'A saved preference from the old site.'
}

function getConfiguredLegacyExportUrl(): string | undefined {
  const configuredUrl: unknown = import.meta.env.VITE_SKEYDB_LEGACY_MIGRATION_URL
  return typeof configuredUrl === 'string' ? configuredUrl : undefined
}

function resolveBridgeErrorMessage(
  error: 'storage_unavailable' | 'snapshot_empty' | 'invalid_target_origin',
): string {
  if (error === 'storage_unavailable') {
    return 'GitHub Pages storage is unavailable in this browser.'
  }
  if (error === 'snapshot_empty') {
    return 'No saved SKeyDB data was found on GitHub Pages.'
  }
  return 'The migration target was rejected.'
}

function resolveApplyErrorMessage(error: string, key: string | undefined): string {
  if (error === 'storage_unavailable') {
    return 'Local storage is unavailable on this domain.'
  }
  if (error === 'backup_failed') {
    return 'Could not create a backup before writing the transfer.'
  }
  if (error === 'write_failed') {
    return key ? `Could not write ${key}.` : 'Could not write the transfer.'
  }
  return 'Could not apply the transfer.'
}
