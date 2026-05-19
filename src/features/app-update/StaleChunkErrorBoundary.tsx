import {Component, type ErrorInfo, type ReactNode} from 'react'

import {isLikelyStaleChunkError} from '@/domain/app-version'

import {AppUpdateNotice} from './AppUpdateNotice'

interface StaleChunkErrorBoundaryProps {
  children: ReactNode
}

interface StaleChunkErrorBoundaryState {
  errorKind: 'chunk-load' | 'unknown' | null
}

export class StaleChunkErrorBoundary extends Component<
  StaleChunkErrorBoundaryProps,
  StaleChunkErrorBoundaryState
> {
  state: StaleChunkErrorBoundaryState = {errorKind: null}

  static getDerivedStateFromError(error: unknown): StaleChunkErrorBoundaryState {
    return {errorKind: isLikelyStaleChunkError(error) ? 'chunk-load' : 'unknown'}
  }

  componentDidCatch(_error: unknown, _errorInfo: ErrorInfo) {
    // React still logs component stack details in development; the rendered recovery surface
    // keeps production from becoming a blank page when an old bundle asks for removed chunks.
  }

  render() {
    if (this.state.errorKind === 'chunk-load') {
      return (
        <div className='app-update-fallback' role='alert'>
          <AppUpdateNotice
            onDismiss={() => undefined}
            onRefresh={() => {
              window.location.reload()
            }}
            reason='chunk-load'
          />
        </div>
      )
    }

    if (this.state.errorKind === 'unknown') {
      return (
        <div className='app-update-fallback' role='alert'>
          <div className='app-update-notice app-update-notice--urgent'>
            <div className='app-update-notice__copy'>
              <strong>SKeyDB hit an unexpected loading problem.</strong>
              <span>Refresh the page and try again.</span>
            </div>
            <div className='app-update-notice__actions'>
              <button
                className='app-update-notice__button'
                onClick={() => {
                  window.location.reload()
                }}
                type='button'
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
