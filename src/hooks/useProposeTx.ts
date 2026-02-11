import { useState, useCallback } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import type { SafeTx } from '../contracts/encoders.ts'

interface ProposeTxState {
  loading: boolean
  error: string | null
  safeTxHash: string | null
}

export function useProposeTx() {
  const { sdk } = useSafeAppsSDK()
  const [state, setState] = useState<ProposeTxState>({
    loading: false,
    error: null,
    safeTxHash: null,
  })

  const proposeTx = useCallback(
    async (txs: SafeTx[]) => {
      setState({ loading: true, error: null, safeTxHash: null })
      try {
        const result = await sdk.txs.send({ txs })
        setState({ loading: false, error: null, safeTxHash: result.safeTxHash })
        return result.safeTxHash
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transaction failed'
        setState({ loading: false, error: msg, safeTxHash: null })
        return null
      }
    },
    [sdk],
  )

  const reset = useCallback(() => {
    setState({ loading: false, error: null, safeTxHash: null })
  }, [])

  return { ...state, proposeTx, reset }
}
