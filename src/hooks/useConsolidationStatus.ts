import { useState, useEffect, useCallback } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { fetchDelegations, fetchIncomingDelegations } from '../api/seize.ts'
import type { Delegation } from '../api/types.ts'

export interface ConsolidationPair {
  address: string
  useCase: number
  outgoing: boolean
  incoming: boolean
}

function isConsolidation(d: Delegation): boolean {
  return d.use_case === 999
}

export function useConsolidationStatus() {
  const { safe } = useSafeAppsSDK()
  const [outgoing, setOutgoing] = useState<Delegation[]>([])
  const [incoming, setIncoming] = useState<Delegation[]>([])
  const [pairs, setPairs] = useState<ConsolidationPair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const buildPairs = (out: Delegation[], inc: Delegation[]): ConsolidationPair[] => {
    const map = new Map<string, ConsolidationPair>()

    for (const d of out) {
      const key = `${d.to_address.toLowerCase()}-${d.use_case}`
      map.set(key, {
        address: d.to_address,
        useCase: d.use_case,
        outgoing: true,
        incoming: false,
      })
    }

    for (const d of inc) {
      const key = `${d.from_address.toLowerCase()}-${d.use_case}`
      const existing = map.get(key)
      if (existing) {
        existing.incoming = true
      } else {
        map.set(key, {
          address: d.from_address,
          useCase: d.use_case,
          outgoing: false,
          incoming: true,
        })
      }
    }

    return Array.from(map.values())
  }

  const refresh = useCallback(async () => {
    if (!safe.safeAddress) return
    setLoading(true)
    setError(null)
    try {
      const [allOutgoing, allIncoming] = await Promise.all([
        fetchDelegations(safe.safeAddress),
        fetchIncomingDelegations(safe.safeAddress),
      ])

      const outFiltered = allOutgoing.filter(isConsolidation)
      const incFiltered = allIncoming.filter(isConsolidation)

      setOutgoing(outFiltered)
      setIncoming(incFiltered)
      setPairs(buildPairs(outFiltered, incFiltered))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch consolidation status')
    } finally {
      setLoading(false)
    }
  }, [safe.safeAddress])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { outgoing, incoming, pairs, loading, error, refresh }
}
