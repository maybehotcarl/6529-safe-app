// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Delegation } from '../../api/types.ts'

const WRONG_CHAIN_MSG = 'Wrong network — switch your Safe to Ethereum Mainnet (chain 1)'

const sampleDelegation: Delegation = {
  block: 100,
  from_address: '0x1234567890abcdef1234567890abcdef12345678',
  to_address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  collection: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
  use_case: 1,
  expiry: 0,
  all_tokens: true,
  token_id: 0,
}

const { mockProposeTx, mockSdkState } = vi.hoisted(() => ({
  mockProposeTx: vi.fn(),
  mockSdkState: { safeAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 5 },
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: {},
    safe: mockSdkState,
  }),
}))

vi.mock('../../hooks/useDelegations.ts', () => ({
  useDelegations: () => ({
    delegations: [sampleDelegation],
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
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

// Mock child components to isolate DelegationsTab
vi.mock('./ConsolidationCard.tsx', () => ({ default: () => <div data-testid="consolidation-card" /> }))
vi.mock('./DelegationManagerCard.tsx', () => ({ default: () => <div data-testid="delegation-manager-card" /> }))
vi.mock('./RegisterForm.tsx', () => ({ default: () => <div data-testid="register-form" /> }))

import DelegationsTab from './DelegationsTab.tsx'

describe('DelegationsTab chain ID guard', () => {
  beforeEach(() => {
    mockProposeTx.mockReset()
    mockSdkState.chainId = 5
  })

  it('blocks revoke and shows error on wrong chain', () => {
    render(<DelegationsTab />)

    // Expand the delegations list
    fireEvent.click(screen.getByText(/Active Delegations/))

    // Click Revoke
    fireEvent.click(screen.getByText('Revoke'))

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })

  it('does not show chain error on revoke when on mainnet', () => {
    mockSdkState.chainId = 1
    render(<DelegationsTab />)

    fireEvent.click(screen.getByText(/Active Delegations/))
    fireEvent.click(screen.getByText('Revoke'))

    expect(screen.queryByText(WRONG_CHAIN_MSG)).toBeNull()
  })
})
