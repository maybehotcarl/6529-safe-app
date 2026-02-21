// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { OwnedNFT } from '../../api/types.ts'

const WRONG_CHAIN_MSG = 'Wrong network — switch your Safe to Ethereum Mainnet (chain 1)'

const sampleNft: OwnedNFT = {
  tokenId: 1,
  contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
  name: 'Meme #1',
  image: 'https://example.com/1.png',
  balance: 1,
  collection: 'The Memes',
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

vi.mock('../../hooks/useOwnedNfts.ts', () => ({
  useOwnedNfts: () => ({
    nfts: [sampleNft],
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

import TransferTab from './TransferTab.tsx'

describe('TransferTab chain ID guard', () => {
  beforeEach(() => {
    mockProposeTx.mockReset()
    mockSdkState.chainId = 5
  })

  it('blocks transfer and shows error on wrong chain', async () => {
    render(<TransferTab />)

    // Enter a recipient
    const input = screen.getByPlaceholderText('0x... or name.eth')
    fireEvent.change(input, { target: { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' } })

    // Select an NFT by clicking on it
    fireEvent.click(screen.getByText('Meme #1'))

    // Click Review Transfer
    await waitFor(() => {
      expect(screen.getByText('Review Transfer')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('Review Transfer'))

    // Confirm the transfer
    await waitFor(() => {
      expect(screen.getByText('Confirm Transfer')).toBeTruthy()
    })
    fireEvent.click(screen.getByText('Confirm Transfer'))

    await waitFor(() => {
      expect(screen.getByText(WRONG_CHAIN_MSG)).toBeTruthy()
    })
    expect(mockProposeTx).not.toHaveBeenCalled()
  })
})
