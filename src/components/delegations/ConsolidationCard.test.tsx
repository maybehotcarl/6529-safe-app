// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ConsolidationPair } from '../../hooks/useConsolidationStatus.ts'

const WRONG_CHAIN_MSG = 'Wrong network — switch your Safe to Ethereum Mainnet (chain 1)'

const incomingPair: ConsolidationPair = {
  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  useCase: 999,
  outgoing: false,
  incoming: true,
}

const outgoingPair: ConsolidationPair = {
  address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  useCase: 999,
  outgoing: true,
  incoming: false,
}

const { mockProposeTx, mockSdkState, mockPairs } = vi.hoisted(() => ({
  mockProposeTx: vi.fn(),
  mockSdkState: { safeAddress: '0x1234567890abcdef1234567890abcdef12345678', chainId: 5 },
  mockPairs: { value: [] as ConsolidationPair[] },
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: {},
    safe: mockSdkState,
  }),
}))

vi.mock('../../hooks/useConsolidationStatus.ts', () => ({
  useConsolidationStatus: () => ({
    pairs: mockPairs.value,
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

vi.mock('../../hooks/useENSResolution.ts', () => ({
  useENSResolution: () => ({
    resolvedAddress: null,
    resolving: false,
    error: null,
  }),
}))

import ConsolidationCard from './ConsolidationCard.tsx'

describe('ConsolidationCard chain ID guard', () => {
  beforeEach(() => {
    mockProposeTx.mockReset()
    mockSdkState.chainId = 5
    mockPairs.value = []
  })

  it('blocks consolidate form submission on wrong chain', () => {
    render(<ConsolidationCard onDelegationChange={vi.fn()} />)

    const input = screen.getByPlaceholderText('0x... or name.eth')
    fireEvent.change(input, { target: { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' } })

    const button = screen.getByRole('button', { name: 'Consolidate' })
    fireEvent.click(button)

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })

  it('blocks accept on wrong chain', () => {
    mockPairs.value = [incomingPair]
    render(<ConsolidationCard onDelegationChange={vi.fn()} />)

    // Expand active consolidations
    fireEvent.click(screen.getByText(/Active Consolidations/))

    // Click Accept to open confirmation
    fireEvent.click(screen.getByText('Accept'))

    // Confirm the accept
    fireEvent.click(screen.getByText('Confirm Accept'))

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })

  it('blocks revoke on wrong chain', () => {
    mockPairs.value = [outgoingPair]
    render(<ConsolidationCard onDelegationChange={vi.fn()} />)

    fireEvent.click(screen.getByText(/Active Consolidations/))

    // Click Revoke to open confirmation
    fireEvent.click(screen.getByText('Revoke'))

    // Confirm the revoke
    fireEvent.click(screen.getByText('Confirm Revoke'))

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })
})
