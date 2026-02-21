// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.tsx'

// Suppress console.error from ErrorBoundary and React during tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function ThrowingChild({ message }: { message: string }) {
  throw new Error(message)
}

function GoodChild() {
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeTruthy()
  })

  it('shows full-screen fallback on error by default', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="Boom" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Boom')).toBeTruthy()
    expect(screen.getByText('Reload App')).toBeTruthy()
    expect(screen.queryByText('Retry')).toBeNull()
  })

  it('shows default message when error has no message', () => {
    function ThrowEmpty() {
      throw new Error('')
    }
    render(
      <ErrorBoundary>
        <ThrowEmpty />
      </ErrorBoundary>,
    )
    expect(screen.getByText('An unexpected error occurred.')).toBeTruthy()
  })

  it('shows compact fallback when compact prop is true', () => {
    render(
      <ErrorBoundary compact>
        <ThrowingChild message="Tab crashed" />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Tab crashed')).toBeTruthy()
    expect(screen.getByText('Retry')).toBeTruthy()
    expect(screen.queryByText('Reload App')).toBeNull()
  })

  it('recovers when Retry is clicked in compact mode', () => {
    let shouldThrow = true
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Oops')
      return <div>Recovered</div>
    }

    render(
      <ErrorBoundary compact>
        <MaybeThrow />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Oops')).toBeTruthy()

    // Fix the child so it won't throw on re-render
    shouldThrow = false
    fireEvent.click(screen.getByText('Retry'))

    expect(screen.getByText('Recovered')).toBeTruthy()
    expect(screen.queryByText('Oops')).toBeNull()
  })

  it('calls console.error via componentDidCatch', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild message="Logged error" />
      </ErrorBoundary>,
    )
    expect(console.error).toHaveBeenCalledWith(
      'ErrorBoundary caught:',
      expect.any(Error),
      expect.any(String),
    )
  })
})
