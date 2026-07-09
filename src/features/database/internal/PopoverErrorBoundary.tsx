import {Component, type ErrorInfo, type ReactNode} from 'react'

/**
 * Properties for the PopoverErrorBoundary component.
 */
interface Props {
  /** React children components to be guarded by error boundaries. */
  children: ReactNode
}

/**
 * State properties tracking rendering failures.
 */
interface State {
  /** True if any child component crashed during lifecycle rendering. */
  hasError: boolean
}

/**
 * Error boundary component that catches crashes in child popovers and shows fallback error UI.
 */
export class PopoverErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(): State {
    return {hasError: true}
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PopoverErrorBoundary caught an error:', error, errorInfo)
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-[80px] w-[320px] flex-col justify-center rounded-[0.4em] border border-red-950/40 bg-red-950/20 p-4 text-center leading-relaxed text-red-200/95 shadow-md'>
          <p className='text-[12px] font-semibold'>Failed to load data</p>
          <p className='mt-1 text-[10px] text-red-300/70'>Internal formula error in render</p>
        </div>
      )
    }

    return this.props.children
  }
}
