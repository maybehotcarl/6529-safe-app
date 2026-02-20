import { useState, useEffect } from 'react'
import { JsonRpcProvider, isAddress, Network } from 'ethers'

// Public mainnet RPC for ENS resolution only
// Using publicnode - free, reliable, CORS-enabled
const network = Network.from('mainnet')
const provider = new JsonRpcProvider('https://ethereum.publicnode.com', network, { staticNetwork: network })

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
    const alreadyHexAddress: boolean = isAddress(trimmed)

    // Already a valid hex address — no ENS needed
    if (!trimmed || alreadyHexAddress) {
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
      } catch (err) {
        setResolvedAddress(null)
        const message = err instanceof Error ? err.message : String(err)
        setError(`Could not resolve "${trimmed}": ${message}`)
      } finally {
        setResolving(false)
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [input])

  return { resolvedAddress, resolving, error }
}
