interface AppUpdateNoticeProps {
  onDismiss: () => void
  onRefresh: () => void
}

export function AppUpdateNotice({onDismiss, onRefresh}: AppUpdateNoticeProps) {
  return (
    <section aria-live='polite' className='app-update-notice' role='status'>
      <div className='app-update-notice__copy'>
        <strong>A new SKeyDB version is available.</strong>
        <span>Refresh when you are ready to pick up the latest data and fixes.</span>
      </div>
      <div className='app-update-notice__actions'>
        <button className='app-update-notice__button' onClick={onRefresh} type='button'>
          Refresh
        </button>
        <button className='app-update-notice__dismiss' onClick={onDismiss} type='button'>
          Not now
        </button>
      </div>
    </section>
  )
}
