import {useEffect, useMemo, useRef} from 'react'

import {FaArrowRight, FaClipboard} from 'react-icons/fa6'
import {useSearchParams} from 'react-router-dom'

import {getBrowserLocalStorage, type StorageLike} from '@/domain/storage'
import {
  isAllowedMigrationSourceOrigin,
  isAllowedMigrationTargetOrigin,
  PRIMARY_MIGRATION_TARGET_URL,
  type MigrationBridgeMessage,
} from '@/domain/storage-migration/migrationBridgeProtocol'
import {
  createDomainStorageMigrationSnapshot,
  type DomainStorageMigrationSnapshot,
} from '@/domain/storage-migration/storageMigrationSnapshot'

type MigrationMessageTarget = {
  postMessage: (message: MigrationBridgeMessage, targetOrigin: string) => void
} | null

interface MigrationExportPageProps {
  storage?: StorageLike | null
  locationLike?: Pick<Location, 'origin' | 'pathname'>
  messageTarget?: MigrationMessageTarget
  allowLocalOrigins?: boolean
}

type ExportStatus = 'sent' | 'manual' | 'error'
type ExportErrorCode =
  | 'missing_details'
  | 'source_not_allowed'
  | 'target_not_allowed'
  | 'storage_unavailable'
  | 'snapshot_empty'

interface ExportError {
  code: ExportErrorCode
  message: string
}

const PRIMARY_ACTION_CLASS =
  'inline-flex items-center gap-2 rounded border border-cyan-300/50 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/25'

export function MigrationExportPage({
  storage = getBrowserLocalStorage(),
  locationLike = window.location,
  messageTarget,
  allowLocalOrigins = import.meta.env.DEV,
}: MigrationExportPageProps) {
  const [searchParams] = useSearchParams()
  const sentRequestKeyRef = useRef<string | null>(null)
  const nonce = searchParams.get('nonce') ?? ''
  const targetOrigin = searchParams.get('targetOrigin') ?? ''
  const targetAllowed = isAllowedMigrationTargetOrigin(targetOrigin, {allowLocalOrigins})
  const sourceAllowed = isAllowedMigrationSourceOrigin(locationLike.origin, {allowLocalOrigins})
  const resolvedMessageTarget = messageTarget === undefined ? getWindowOpener() : messageTarget
  const snapshot = useMemo<DomainStorageMigrationSnapshot | null>(() => {
    if (!storage) {
      return null
    }
    return createDomainStorageMigrationSnapshot(storage, locationLike)
  }, [storage, locationLike])
  const serializedSnapshot = snapshot ? JSON.stringify(snapshot) : ''
  const error = resolveExportError({nonce, snapshot, sourceAllowed, targetAllowed, targetOrigin})
  const status = resolveExportStatus(error, resolvedMessageTarget)
  const showStartOnNewDomainLink =
    error?.code === 'missing_details' || error?.code === 'target_not_allowed'

  useEffect(() => {
    const requestKey = `${nonce}:${targetOrigin}`
    if (sentRequestKeyRef.current === requestKey) {
      return
    }
    if (!nonce || !targetOrigin || !targetAllowed || !sourceAllowed || !resolvedMessageTarget) {
      return
    }

    sentRequestKeyRef.current = requestKey
    if (!snapshot) {
      const message: MigrationBridgeMessage = {
        type: 'skeydb:migration-error:v1',
        nonce,
        error: 'storage_unavailable',
      }
      resolvedMessageTarget.postMessage(message, targetOrigin)
      return
    }

    if (snapshot.entries.length === 0) {
      const message: MigrationBridgeMessage = {
        type: 'skeydb:migration-error:v1',
        nonce,
        error: 'snapshot_empty',
      }
      resolvedMessageTarget.postMessage(message, targetOrigin)
      return
    }

    const message: MigrationBridgeMessage = {
      type: 'skeydb:migration-snapshot:v1',
      nonce,
      snapshot,
    }
    resolvedMessageTarget.postMessage(message, targetOrigin)
  }, [nonce, resolvedMessageTarget, snapshot, sourceAllowed, targetAllowed, targetOrigin])

  return (
    <section className='mx-auto max-w-2xl space-y-4 px-2 py-8 text-slate-100'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>
          {showStartOnNewDomainLink ? 'Start from skeydb.com' : 'SKeyDB domain transfer'}
        </h2>
        <p className='text-sm text-slate-300'>
          {status === 'sent'
            ? 'Transfer sent. Return to the skeydb.com tab to review it.'
            : resolveExportIntro(status, showStartOnNewDomainLink)}
        </p>
      </div>

      {error ? (
        <p className='rounded border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100'>
          {error.message}
        </p>
      ) : null}

      {showStartOnNewDomainLink ? (
        <a className={PRIMARY_ACTION_CLASS} href={PRIMARY_MIGRATION_TARGET_URL}>
          <FaArrowRight aria-hidden='true' />
          Open skeydb.com
        </a>
      ) : null}

      {status === 'manual' && serializedSnapshot ? (
        <div className='space-y-2'>
          <p className='text-sm text-slate-300'>
            Copy this transfer code, return to skeydb.com, and paste it under "Paste a transfer
            code."
          </p>
          <label className='block text-sm font-medium text-slate-200' htmlFor='migration-snapshot'>
            Transfer code
          </label>
          <textarea
            className='min-h-40 w-full rounded border border-slate-600 bg-slate-950 p-3 font-mono text-xs text-slate-100'
            id='migration-snapshot'
            readOnly
            value={serializedSnapshot}
          />
          <p className='inline-flex items-center gap-2 text-xs text-slate-400'>
            <FaClipboard aria-hidden='true' />
            This code only contains SKeyDB data saved in this browser.
          </p>
        </div>
      ) : null}
    </section>
  )
}

function getWindowOpener(): MigrationMessageTarget {
  const opener: unknown = window.opener
  return isMigrationMessageTarget(opener) ? opener : null
}

function isMigrationMessageTarget(value: unknown): value is Exclude<MigrationMessageTarget, null> {
  return (
    !!value &&
    typeof value === 'object' &&
    'postMessage' in value &&
    typeof value.postMessage === 'function'
  )
}

function resolveExportError({
  nonce,
  snapshot,
  sourceAllowed,
  targetAllowed,
  targetOrigin,
}: {
  nonce: string
  snapshot: DomainStorageMigrationSnapshot | null
  sourceAllowed: boolean
  targetAllowed: boolean
  targetOrigin: string
}): ExportError | null {
  if (!nonce || !targetOrigin) {
    return {
      code: 'missing_details',
      message:
        'Start from skeydb.com to move saved data. GitHub Pages prepares the transfer after the new site asks for it.',
    }
  }
  if (!sourceAllowed) {
    return {
      code: 'source_not_allowed',
      message: 'This transfer page only works from the old GitHub Pages site.',
    }
  }
  if (!targetAllowed) {
    return {
      code: 'target_not_allowed',
      message:
        'Start from skeydb.com to move saved data. This old-site tab does not know where to send the transfer.',
    }
  }
  if (!snapshot) {
    return {
      code: 'storage_unavailable',
      message: 'Saved data is unavailable in this browser.',
    }
  }
  if (snapshot.entries.length === 0) {
    return {
      code: 'snapshot_empty',
      message: 'No saved SKeyDB data was found on GitHub Pages.',
    }
  }
  return null
}

function resolveExportStatus(
  error: ExportError | null,
  messageTarget: MigrationMessageTarget,
): ExportStatus {
  if (error) {
    return 'error'
  }
  return messageTarget ? 'sent' : 'manual'
}

function resolveExportIntro(status: ExportStatus, showStartOnNewDomainLink: boolean): string {
  if (showStartOnNewDomainLink) {
    return 'This page is the old-site handoff step. The transfer starts from the new SKeyDB home.'
  }
  if (status === 'manual') {
    return 'Your browser blocked the automatic handoff, so use the code below.'
  }
  return 'Preparing saved data for transfer.'
}
