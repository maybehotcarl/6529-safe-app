import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** When true, renders a compact inline fallback instead of full-screen */
  compact?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.compact) {
        return (
          <div className="p-4 bg-gray-900 rounded-lg border border-red-700 text-center space-y-2">
            <p className="text-sm text-red-400 font-medium">Something went wrong</p>
            <p className="text-xs text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-accent hover:bg-accent-hover text-white rounded px-3 py-1 text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        )
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-lg font-bold text-red-400">Something went wrong</h1>
            <p className="text-sm text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-accent hover:bg-accent-hover text-white rounded px-4 py-2 text-sm transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
