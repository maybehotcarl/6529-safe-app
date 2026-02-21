// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

vi.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: { txs: { send: mockSend } },
    safe: { safeAddress: '0x1234' },
  }),
}))

import { useProposeTx } from './useProposeTx.ts'

const dummyTx = { to: '0x1', value: '0', data: '0x' }

describe('useProposeTx', () => {
  beforeEach(() => {
    mockSend.mockReset()
  })

  it('returns initial idle state', () => {
    const { result } = renderHook(() => useProposeTx())
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.safeTxHash).toBeNull()
  })

  it('sends transaction and sets safeTxHash on success', async () => {
    mockSend.mockResolvedValue({ safeTxHash: '0xabc123' })
    const { result } = renderHook(() => useProposeTx())

    let hash: string | null = null
    await act(async () => {
      hash = await result.current.proposeTx([dummyTx])
    })

    expect(hash).toBe('0xabc123')
    expect(result.current.safeTxHash).toBe('0xabc123')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(mockSend).toHaveBeenCalledWith({ txs: [dummyTx] })
  })

  it('sets error on rejection with Error', async () => {
    mockSend.mockRejectedValue(new Error('User rejected'))
    const { result } = renderHook(() => useProposeTx())

    let hash: string | null = null
    await act(async () => {
      hash = await result.current.proposeTx([dummyTx])
    })

    expect(hash).toBeNull()
    expect(result.current.error).toBe('User rejected')
    expect(result.current.safeTxHash).toBeNull()
  })

  it('sets generic error on non-Error rejection', async () => {
    mockSend.mockRejectedValue('something broke')
    const { result } = renderHook(() => useProposeTx())

    await act(async () => {
      await result.current.proposeTx([dummyTx])
    })

    expect(result.current.error).toBe('Transaction failed')
  })

  it('resets state', async () => {
    mockSend.mockResolvedValue({ safeTxHash: '0xabc123' })
    const { result } = renderHook(() => useProposeTx())

    await act(async () => {
      await result.current.proposeTx([dummyTx])
    })
    expect(result.current.safeTxHash).toBe('0xabc123')

    act(() => {
      result.current.reset()
    })

    expect(result.current.safeTxHash).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
