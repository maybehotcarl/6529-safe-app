import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { useDelegations } from '../../hooks/useDelegations.ts'
import { USE_CASES, getCollectionName } from '../../lib/constants.ts'
import { ALL_COLLECTIONS_ADDRESS, CONTRACTS } from '../../contracts/addresses.ts'
import { encodeRevokeDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import ConsolidationCard from './ConsolidationCard.tsx'
import DelegationManagerCard from './DelegationManagerCard.tsx'
import RegisterForm from './RegisterForm.tsx'

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatExpiry(timestamp: number): string {
  if (!timestamp || timestamp === 0) return 'Never'
  const date = new Date(timestamp * 1000)
  if (date.getTime() < Date.now()) return 'Expired'
  return date.toLocaleDateString()
}

export default function DelegationsTab() {
  const { safe } = useSafeAppsSDK()
  const { delegations, loading, error, refresh } = useDelegations()
  const { loading: revoking, proposeTx } = useProposeTx()
  const [showDelegations, setShowDelegations] = useState(false)

  const handleRevoke = async (delegation: { collection: string; to_address: string; use_case: number }) => {
    const tx = encodeRevokeDelegation(
      delegation.collection,
      delegation.to_address,
      delegation.use_case,
    )
    const hash = await proposeTx([tx])
    if (hash) refresh()
  }

  return (
    <div className="space-y-6">
      <ConsolidationCard onDelegationChange={refresh} />
      <DelegationManagerCard onDelegationChange={refresh} />
      <RegisterForm onSuccess={refresh} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowDelegations(!showDelegations)}
            className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-white transition-colors"
          >
            <span className={`text-xs transition-transform ${showDelegations ? 'rotate-90' : ''}`}>&#9654;</span>
            Active Delegations{!loading && ` (${delegations.length})`}
          </button>
          <button
            onClick={refresh}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>

        {showDelegations && loading && (
          <div className="text-sm text-gray-400 py-8 text-center">Loading delegations...</div>
        )}

        {showDelegations && error && (
          <div className="text-sm text-danger py-4">{error}</div>
        )}

        {showDelegations && !loading && !error && delegations.length === 0 && (
          <div className="text-sm text-gray-400 py-8 text-center border border-gray-700 rounded-lg">
            No active delegations found
          </div>
        )}

        {showDelegations && !loading && delegations.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-700">
                  <th className="pb-2 pr-4">Delegate</th>
                  <th className="pb-2 pr-4">Use Case</th>
                  <th className="pb-2 pr-4">Collection</th>
                  <th className="pb-2 pr-4">Expiry</th>
                  <th className="pb-2 pr-4">Verify</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {delegations.map((d, i) => {
                  const etherscanUrl = `https://etherscan.io/address/${CONTRACTS.NFT_DELEGATION}?a=${safe.safeAddress}#readContract`
                  return (
                    <tr key={i} className="border-b border-gray-800 hover:bg-gray-900/50">
                      <td className="py-2 pr-4 font-mono text-xs">{shortenAddress(d.to_address)}</td>
                      <td className="py-2 pr-4">{USE_CASES[d.use_case] ?? `#${d.use_case}`}</td>
                      <td className="py-2 pr-4">
                        {d.collection.toLowerCase() === ALL_COLLECTIONS_ADDRESS.toLowerCase()
                          ? 'All'
                          : getCollectionName(d.collection)}
                      </td>
                      <td className="py-2 pr-4">{formatExpiry(d.expiry)}</td>
                      <td className="py-2 pr-4">
                        <a
                          href={etherscanUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-accent-hover transition-colors"
                          title="Verify on-chain on Etherscan"
                        >
                          Etherscan ↗
                        </a>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleRevoke(d)}
                          disabled={revoking}
                          className="text-xs text-danger hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
