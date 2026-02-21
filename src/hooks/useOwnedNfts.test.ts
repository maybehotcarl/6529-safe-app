// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const { mockFetchOwnedNfts, mockSdkState } = vi.hoisted(() => ({
  mockFetchOwnedNfts: vi.fn(),
  mockSdkState: { safeAddress: '0xSafe' },
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: {},
    safe: mockSdkState,
  }),
}))

vi.mock('../api/seize.ts', () => ({
  fetchOwnedNfts: (...args: unknown[]) => mockFetchOwnedNfts(...args),
}))

import { useOwnedNfts } from './useOwnedNfts.ts'
import type { OwnedNFT } from '../api/types.ts'

const sampleNft: OwnedNFT = {
  tokenId: 1,
  contract: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
  name: 'Meme #1',
  image: 'https://example.com/1.png',
  balance: 1,
  collection: 'The Memes',
}

describe('useOwnedNfts', () => {
  beforeEach(() => {
    mockFetchOwnedNfts.mockReset()
    mockSdkState.safeAddress = '0xSafe'
  })

  it('fetches NFTs on mount', async () => {
    mockFetchOwnedNfts.mockResolvedValue([sampleNft])
    const { result } = renderHook(() => useOwnedNfts())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.nfts).toEqual([sampleNft])
    expect(result.current.error).toBeNull()
    expect(mockFetchOwnedNfts).toHaveBeenCalledWith('0xSafe', undefined)
  })

  it('passes contractFilter to fetchOwnedNfts', async () => {
    mockFetchOwnedNfts.mockResolvedValue([])
    const filter = '0x33FD426905F149f8376e227d0C9D3340AaD17aF1'
    renderHook(() => useOwnedNfts(filter))

    await waitFor(() => expect(mockFetchOwnedNfts).toHaveBeenCalled())
    expect(mockFetchOwnedNfts).toHaveBeenCalledWith('0xSafe', filter)
  })

  it('sets error on fetch failure', async () => {
    mockFetchOwnedNfts.mockRejectedValue(new Error('API down'))
    const { result } = renderHook(() => useOwnedNfts())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('API down')
    expect(result.current.nfts).toEqual([])
  })

  it('does not fetch when safeAddress is empty', () => {
    mockSdkState.safeAddress = ''
    renderHook(() => useOwnedNfts())

    expect(mockFetchOwnedNfts).not.toHaveBeenCalled()
  })
})
