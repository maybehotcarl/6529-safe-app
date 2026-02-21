// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockResolveName } = vi.hoisted(() => ({
  mockResolveName: vi.fn(),
}))

vi.mock('ethers', () => {
  class MockJsonRpcProvider {
    resolveName = mockResolveName
  }
  return {
    JsonRpcProvider: MockJsonRpcProvider,
    isAddress: (value: string) => /^0x[0-9a-fA-F]{40}$/.test(value),
    Network: { from: () => ({}) },
  }
})

import { useENSResolution } from './useENSResolution.ts'

describe('useENSResolution', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockResolveName.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for empty input', () => {
    const { result } = renderHook(() => useENSResolution(''))
    expect(result.current.resolvedAddress).toBeNull()
    expect(result.current.resolving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns null for valid hex address (no resolution needed)', () => {
    const { result } = renderHook(() =>
      useENSResolution('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
    )
    expect(result.current.resolvedAddress).toBeNull()
    expect(result.current.resolving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns null for input without a dot', () => {
    const { result } = renderHook(() => useENSResolution('notanens'))
    expect(result.current.resolvedAddress).toBeNull()
    expect(result.current.resolving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('resolves ENS name after debounce', async () => {
    const resolved = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    mockResolveName.mockResolvedValue(resolved)

    const { result } = renderHook(() => useENSResolution('vitalik.eth'))
    expect(result.current.resolving).toBe(true)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.resolving).toBe(false)
    expect(result.current.resolvedAddress).toBe(resolved)
    expect(result.current.error).toBeNull()
  })

  it('sets error when resolution returns null', async () => {
    mockResolveName.mockResolvedValue(null)

    const { result } = renderHook(() => useENSResolution('nonexistent.eth'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.resolving).toBe(false)
    expect(result.current.resolvedAddress).toBeNull()
    expect(result.current.error).toContain('Could not resolve')
  })

  it('sets error when provider throws', async () => {
    mockResolveName.mockRejectedValue(new Error('RPC failure'))

    const { result } = renderHook(() => useENSResolution('bad.eth'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.resolving).toBe(false)
    expect(result.current.resolvedAddress).toBeNull()
    expect(result.current.error).toContain('RPC failure')
  })
})
