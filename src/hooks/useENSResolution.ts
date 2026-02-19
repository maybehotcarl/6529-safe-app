import { useState, useEffect } from 'react'
import { JsonRpcProvider, isAddress } from 'ethers'

// Public mainnet RPC for ENS resolution only
const provider = new JsonRpcProvider('https://cloudflare-eth.com')

export interface ENSResolution {
  resolvedAddress: string | null
  resolving: boolean
  error: string | null
}

export function useENSResolution(input: string): ENSResolution {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const trimmed = input.trim()

    // Already a valid hex address — no ENS needed
    if (!trimmed || isAddress(trimmed)) {
      setResolvedAddress(null)
      setResolving(false)
      setError(null)
      return
    }

    // Must contain a dot to be a valid ENS name
    if (!trimmed.includes('.')) {
      setResolvedAddress(null)
      setResolving(false)
      setError(null)
      return
    }

    setResolving(true)
    setError(null)
    setResolvedAddress(null)

    const timer = setTimeout(async () => {
      try {
        const address = await provider.resolveName(trimmed)
        if (address) {
          setResolvedAddress(address)
          setError(null)
        } else {
          setResolvedAddress(null)
          setError(`Could not resolve "${trimmed}"`)
        }
      } catch {
        setResolvedAddress(null)
        setError(`Could not resolve "${trimmed}"`)
      } finally {
        setResolving(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [input])

  return { resolvedAddress, resolving, error }
}
