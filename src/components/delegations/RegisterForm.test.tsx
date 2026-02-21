// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const WRONG_CHAIN_MSG = 'Wrong network — switch your Safe to Ethereum Mainnet (chain 1)'

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

import RegisterForm from './RegisterForm.tsx'

describe('RegisterForm chain ID guard', () => {
  beforeEach(() => {
    mockProposeTx.mockReset()
    mockSdkState.chainId = 5
  })

  it('blocks submission and shows error on wrong chain', () => {
    render(<RegisterForm onSuccess={vi.fn()} />)

    const input = screen.getByPlaceholderText('0x... or name.eth')
    fireEvent.change(input, { target: { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' } })

    const button = screen.getByRole('button', { name: 'Register Delegation' })
    fireEvent.click(button)

    expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    expect(mockProposeTx).not.toHaveBeenCalled()
  })

  it('does not show chain error on mainnet', () => {
    mockSdkState.chainId = 1
    render(<RegisterForm onSuccess={vi.fn()} />)

    const input = screen.getByPlaceholderText('0x... or name.eth')
    fireEvent.change(input, { target: { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' } })

    const button = screen.getByRole('button', { name: 'Register Delegation' })
    fireEvent.click(button)

    expect(screen.queryByText(WRONG_CHAIN_MSG)).toBeNull()
  })
})
