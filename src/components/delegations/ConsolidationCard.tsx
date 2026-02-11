import { useState } from 'react'
import { useConsolidationStatus } from '../../hooks/useConsolidationStatus.ts'
import type { ConsolidationPair } from '../../hooks/useConsolidationStatus.ts'
import { ALL_COLLECTIONS_ADDRESS } from '../../contracts/addresses.ts'
import { encodeRegisterDelegation, encodeRevokeDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function PairStatus({ pair }: { pair: ConsolidationPair }) {
  if (pair.outgoing && pair.incoming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        Fully consolidated
      </span>
    )
  }
  if (pair.outgoing && !pair.incoming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-400">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        Waiting — other wallet must register back
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400">
      <span className="w-2 h-2 rounded-full bg-blue-400" />
      Incoming — you need to accept
    </span>
  )
}

interface Props {
  onDelegationChange: () => void
}

export default function ConsolidationCard({ onDelegationChange }: Props) {
  const { pairs, loading, error, refresh } = useConsolidationStatus()
  const { loading: proposing, error: txError, safeTxHash, proposeTx, reset } = useProposeTx()

  const [walletAddress, setWalletAddress] = useState('')
  const [useCase, setUseCase] = useState(998)

  const handleConsolidate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      alert('Invalid Ethereum address')
      return
    }

    const tx = encodeRegisterDelegation(
      ALL_COLLECTIONS_ADDRESS,
      walletAddress,
      0n,
      useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setWalletAddress('')
      refresh()
      onDelegationChange()
    }
  }

  const handleAccept = async (pair: ConsolidationPair) => {
    const tx = encodeRegisterDelegation(
      ALL_COLLECTIONS_ADDRESS,
      pair.address,
      0n,
      pair.useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      refresh()
      onDelegationChange()
    }
  }

  const handleRevoke = async (pair: ConsolidationPair) => {
    const tx = encodeRevokeDelegation(
      ALL_COLLECTIONS_ADDRESS,
      pair.address,
      pair.useCase,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      refresh()
      onDelegationChange()
    }
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
          Wallet Consolidation
        </h3>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Link your Safe to a hot wallet so seize.io sees them as one identity.
        Both wallets must register to each other for consolidation to take effect.
      </p>

      {/* Existing consolidation pairs */}
      {loading && (
        <div className="text-xs text-gray-400 py-2">Checking consolidation status...</div>
      )}

      {error && <div className="text-xs text-danger">{error}</div>}

      {!loading && pairs.length > 0 && (
        <div className="space-y-2">
          {pairs.map((pair) => (
            <div
              key={`${pair.address}-${pair.useCase}`}
              className="flex items-center justify-between gap-3 p-3 bg-gray-800 rounded border border-gray-700"
            >
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs truncate">{shortenAddress(pair.address)}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {pair.useCase === 998 ? 'Same Person' : 'Bi-directional'} (#{pair.useCase})
                </div>
              </div>
              <PairStatus pair={pair} />
              <div className="flex gap-2">
                {pair.incoming && !pair.outgoing && (
                  <button
                    onClick={() => handleAccept(pair)}
                    disabled={proposing}
                    className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                )}
                {pair.outgoing && (
                  <button
                    onClick={() => handleRevoke(pair)}
                    disabled={proposing}
                    className="text-xs text-danger hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consolidation form */}
      <form onSubmit={handleConsolidate} className="space-y-3 pt-2 border-t border-gray-700">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Wallet Address</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Consolidation Type</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="consolidation-type"
                checked={useCase === 998}
                onChange={() => setUseCase(998)}
                className="accent-accent"
              />
              <span className="text-sm">Same Person (998)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="consolidation-type"
                checked={useCase === 999}
                onChange={() => setUseCase(999)}
                className="accent-accent"
              />
              <span className="text-sm">Bi-directional (999)</span>
            </label>
          </div>
        </div>

        {txError && <div className="text-xs text-danger">{txError}</div>}
        {safeTxHash && (
          <div className="text-xs text-success">
            Tx proposed! Hash: {safeTxHash.slice(0, 10)}...
            <button type="button" onClick={reset} className="ml-2 underline">OK</button>
          </div>
        )}

        <button
          type="submit"
          disabled={proposing || !walletAddress}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
        >
          {proposing ? 'Proposing...' : 'Consolidate'}
        </button>
      </form>
    </div>
  )
}
