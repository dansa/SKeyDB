export type AppUpdateReason = 'chunk-load' | 'version'

interface AppUpdateNoticeProps {
  onDismiss: () => void
  onRefresh: () => void
  reason: AppUpdateReason
}

export function AppUpdateNotice({onDismiss, onRefresh, reason}: AppUpdateNoticeProps) {
  const isChunkLoadFailure = reason === 'chunk-load'

  return (
    <section
      aria-live='polite'
      className={`app-update-notice ${isChunkLoadFailure ? 'app-update-notice--urgent' : ''}`}
      role='status'
    >
      <div className='app-update-notice__copy'>
        <strong>
          {isChunkLoadFailure
            ? 'SKeyDB could not finish loading.'
            : 'A new SKeyDB version is available.'}
        </strong>
        <span>
          {isChunkLoadFailure
            ? 'The site was updated while this tab was open. Refresh to load the newest files.'
            : 'Refresh when you are ready to pick up the latest data and fixes.'}
        </span>
      </div>
      <div className='app-update-notice__actions'>
        <button className='app-update-notice__button' onClick={onRefresh} type='button'>
          Refresh
        </button>
        {!isChunkLoadFailure && (
          <button className='app-update-notice__dismiss' onClick={onDismiss} type='button'>
            Not now
          </button>
        )}
      </div>
    </section>
  )
}
