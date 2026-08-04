import {useEffect, useMemo, useRef} from 'react'

import {FaArrowRight} from 'react-icons/fa6'
import {useSearchParams} from 'react-router'

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

import {ManualTransferCodePanel} from './ManualTransferCodePanel'

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
type ExportErrorCode = 'source_not_allowed' | 'storage_unavailable' | 'snapshot_empty'

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
  const error = resolveExportError({snapshot, sourceAllowed})
  const canPostAutomatically = Boolean(
    nonce && targetOrigin && targetAllowed && sourceAllowed && resolvedMessageTarget,
  )
  const status = resolveExportStatus(error, canPostAutomatically)
  const showNewDomainLink = status === 'manual'

  useEffect(() => {
    const requestKey = `${nonce}:${targetOrigin}`
    if (sentRequestKeyRef.current === requestKey) {
      return
    }
    if (!canPostAutomatically || !resolvedMessageTarget) {
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
  }, [canPostAutomatically, nonce, resolvedMessageTarget, snapshot, targetOrigin])

  return (
    <section className='mx-auto max-w-2xl space-y-4 px-2 py-8 text-slate-100'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>
          {status === 'manual' ? 'Copy your transfer code' : 'SKeyDB domain transfer'}
        </h2>
        <p className='text-sm text-slate-300'>
          {status === 'sent'
            ? 'Transfer sent. Return to the skeydb.com tab to review it.'
            : resolveExportIntro(status)}
        </p>
      </div>

      {error ? (
        <p className='rounded border border-rose-400/50 bg-rose-950/40 px-3 py-2 text-sm text-rose-100'>
          {error.message}
        </p>
      ) : null}

      {showNewDomainLink ? (
        <a className={PRIMARY_ACTION_CLASS} href={PRIMARY_MIGRATION_TARGET_URL}>
          <FaArrowRight aria-hidden='true' />
          Open skeydb.com
        </a>
      ) : null}

      {status === 'manual' && serializedSnapshot ? (
        <ManualTransferCodePanel transferCode={serializedSnapshot} />
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
  snapshot,
  sourceAllowed,
}: {
  snapshot: DomainStorageMigrationSnapshot | null
  sourceAllowed: boolean
}): ExportError | null {
  if (!sourceAllowed) {
    return {
      code: 'source_not_allowed',
      message: 'This transfer page only works from the old GitHub Pages site.',
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
  canPostAutomatically: boolean,
): ExportStatus {
  if (error) {
    return 'error'
  }
  return canPostAutomatically ? 'sent' : 'manual'
}

function resolveExportIntro(status: ExportStatus): string {
  if (status === 'manual') {
    return 'This is the old-site handoff page. Copy the code below and paste it on skeydb.com.'
  }
  return 'Preparing saved data for transfer.'
}
