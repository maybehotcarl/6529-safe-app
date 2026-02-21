// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { mockFetchDelegations, mockSdkState } = vi.hoisted(() => ({
  mockFetchDelegations: vi.fn(),
  mockSdkState: { safeAddress: '0xSafe' },
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: {},
    safe: mockSdkState,
  }),
}))

vi.mock('../api/seize.ts', () => ({
  fetchDelegations: (...args: unknown[]) => mockFetchDelegations(...args),
}))

import { useDelegations } from './useDelegations.ts'
import type { Delegation } from '../api/types.ts'

const sampleDelegation: Delegation = {
  block: 100,
  from_address: '0xSafe',
  to_address: '0xTarget',
  collection: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
  use_case: 1,
  expiry: 0,
  all_tokens: true,
  token_id: 0,
}

describe('useDelegations', () => {
  beforeEach(() => {
    mockFetchDelegations.mockReset()
    mockSdkState.safeAddress = '0xSafe'
  })

  it('fetches delegations on mount', async () => {
    mockFetchDelegations.mockResolvedValue([sampleDelegation])
    const { result } = renderHook(() => useDelegations())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.delegations).toEqual([sampleDelegation])
    expect(result.current.error).toBeNull()
    expect(mockFetchDelegations).toHaveBeenCalledWith('0xSafe')
  })

  it('sets error on fetch failure', async () => {
    mockFetchDelegations.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useDelegations())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.delegations).toEqual([])
  })

  it('does not fetch when safeAddress is empty', () => {
    mockSdkState.safeAddress = ''
    const { result } = renderHook(() => useDelegations())

    expect(mockFetchDelegations).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(true)
  })
})
