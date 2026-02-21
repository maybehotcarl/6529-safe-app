import { useState, useEffect, useCallback } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { fetchDelegations } from '../api/seize.ts'
import type { Delegation } from '../api/types.ts'

export function useDelegations() {
  const { safe } = useSafeAppsSDK()
  const [delegations, setDelegations] = useState<Delegation[]>([])
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
      const data = await fetchDelegations(safe.safeAddress)
      setDelegations(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch delegations')
    } finally {
      setLoading(false)
    }
  }, [safe.safeAddress])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { delegations, loading, error, refresh }
}
