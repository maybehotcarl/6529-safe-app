// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Delegation } from '../../api/types.ts'

const WRONG_CHAIN_MSG = 'Wrong network — switch your Safe to Ethereum Mainnet (chain 1)'

const managerDelegation: Delegation = {
  block: 100,
  from_address: '0x1234567890abcdef1234567890abcdef12345678',
  to_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  collection: '0x8888888888888888888888888888888888888888',
  use_case: 998,
  expiry: 0,
  all_tokens: true,
  token_id: 0,
}

const { mockProposeTx, mockSdkState, mockFetchDelegations } = vi.hoisted(() => ({
  mockProposeTx: vi.fn(),
  mockSdkState: { safeAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 5 },
  mockFetchDelegations: vi.fn(),
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: {},
    safe: mockSdkState,
  }),
}))

vi.mock('../../api/seize.ts', () => ({
  fetchDelegations: (...args: unknown[]) => mockFetchDelegations(...args),
}))

vi.mock('../../hooks/useProposeTx.ts', () => ({
  useProposeTx: () => ({
    loading: false,
    error: null,
    safeTxHash: null,
    proposeTx: mockProposeTx,
    reset: vi.fn(),
  }),
}))

vi.mock('../../hooks/useENSResolution.ts', () => ({
  useENSResolution: () => ({
    resolvedAddress: null,
    resolving: false,
    error: null,
  }),
}))

import DelegationManagerCard from './DelegationManagerCard.tsx'

describe('DelegationManagerCard chain ID guard', () => {
  beforeEach(() => {
    mockProposeTx.mockReset()
    mockFetchDelegations.mockReset()
    mockSdkState.chainId = 5
  })

  it('blocks grant submission on wrong chain', async () => {
    mockFetchDelegations.mockResolvedValue([])
    render(<DelegationManagerCard onDelegationChange={vi.fn()} />)

    await waitFor(() => {
      expect(screen.queryByText('Checking delegation managers...')).toBeNull()
    })

    const input = screen.getByPlaceholderText('0x... or name.eth')
    fireEvent.change(input, { target: { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' } })

    fireEvent.click(screen.getByRole('button', { name: 'Grant Manager Access' }))

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })

  it('blocks revoke on wrong chain', async () => {
    mockFetchDelegations.mockResolvedValue([managerDelegation])
    render(<DelegationManagerCard onDelegationChange={vi.fn()} />)

    // Wait for managers to load
    await waitFor(() => {
      expect(screen.getByText(/Active Managers/)).toBeTruthy()
    })

    // Expand managers list
    fireEvent.click(screen.getByText(/Active Managers/))

    // Click Revoke to open confirmation
    fireEvent.click(screen.getByText('Revoke'))

    // Confirm
    fireEvent.click(screen.getByText('Confirm Revoke'))

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })
})
