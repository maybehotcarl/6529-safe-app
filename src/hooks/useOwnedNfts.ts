import { useState, useEffect, useCallback } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { fetchOwnedNfts } from '../api/seize.ts'
import type { OwnedNFT } from '../api/types.ts'

export function useOwnedNfts(contractFilter?: string) {
  const { safe } = useSafeAppsSDK()
  const [nfts, setNfts] = useState<OwnedNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!safe.safeAddress) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOwnedNfts(safe.safeAddress, contractFilter)
      setNfts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch NFTs')
    } finally {
      setLoading(false)
    }
  }, [safe.safeAddress, contractFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { nfts, loading, error, refresh }
}
