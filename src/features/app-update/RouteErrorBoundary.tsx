import {Component, type ErrorInfo, type ReactNode} from 'react'

interface RouteErrorBoundaryProps {
  children: ReactNode
  onError: (error: unknown, errorInfo: ErrorInfo) => void
  resetKey: string
}

interface RouteErrorBoundaryState {
  failed: boolean
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {failed: false}

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return {failed: true}
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    this.props.onError(error, errorInfo)
  }

  componentDidUpdate(previousProps: RouteErrorBoundaryProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({failed: false})
    }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
