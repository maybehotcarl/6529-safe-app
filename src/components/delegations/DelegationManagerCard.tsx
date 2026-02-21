import { useState, useEffect, useCallback } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { fetchDelegations } from '../../api/seize.ts'
import type { Delegation } from '../../api/types.ts'
import { ALL_COLLECTIONS_ADDRESS } from '../../contracts/addresses.ts'
import { encodeRegisterDelegation, encodeRevokeDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import { validateAddress } from '../../lib/validation.ts'
import { useENSResolution } from '../../hooks/useENSResolution.ts'
import { ONE_YEAR_SECS, formatExpiry } from '../../lib/constants.ts'

const USE_CASE_DELEGATION_MANAGER = 998

interface Props {
  onDelegationChange: () => void
}

export default function DelegationManagerCard({ onDelegationChange }: Props) {
  const { safe } = useSafeAppsSDK()
  const { loading: proposing, error: txError, safeTxHash, proposeTx, reset } = useProposeTx()

  const [managers, setManagers] = useState<Delegation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showManagers, setShowManagers] = useState(false)

  const [walletAddress, setWalletAddress] = useState('')
  const [expiryOption, setExpiryOption] = useState<'forever' | '1year'>('forever')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [confirmRevoke, setConfirmRevoke] = useState<Delegation | null>(null)

  const { resolvedAddress: ensResolved, resolving: ensResolving, error: ensError } = useENSResolution(walletAddress)
  const effectiveWalletAddress = ensResolved ?? walletAddress

  const refresh = useCallback(async () => {
    if (!safe.safeAddress) return
    setLoading(true)
    setFetchError(null)
    try {
      const data = await fetchDelegations(safe.safeAddress)
      setManagers(data.filter(d => d.use_case === USE_CASE_DELEGATION_MANAGER))
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Failed to fetch delegation managers')
    } finally {
      setLoading(false)
    }
  }, [safe.safeAddress])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getExpiry = () =>
    expiryOption === '1year'
      ? BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECS
      : 0n

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const result = validateAddress(effectiveWalletAddress, safe.safeAddress)
    if (!result.valid) {
      setValidationError(result.error)
      return
    }

    const tx = encodeRegisterDelegation(
      ALL_COLLECTIONS_ADDRESS,
      result.address,
      getExpiry(),
      USE_CASE_DELEGATION_MANAGER,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setWalletAddress('')
      setExpiryOption('forever')
      setValidationError(null)
      refresh()
      onDelegationChange()
    }
  }

  const handleRevokeConfirmed = async (d: Delegation) => {
    const tx = encodeRevokeDelegation(
      d.collection,
      d.to_address,
      d.use_case,
    )
    const hash = await proposeTx([tx])
    setConfirmRevoke(null)
    if (hash) {
      refresh()
      onDelegationChange()
    }
  }

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
          Delegation Manager
        </h3>
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Grant a wallet the right to add or remove delegations on behalf of this Safe (use case 998).
        Only one initial transaction is needed from the Safe — the manager handles everything after.
      </p>

      {/* Current managers */}
      {loading && (
        <div className="text-xs text-gray-400 py-2">Checking delegation managers...</div>
      )}

      {fetchError && <div className="text-xs text-danger">{fetchError}</div>}

      {!loading && managers.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowManagers(!showManagers)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className={`transition-transform ${showManagers ? 'rotate-90' : ''}`}>&#9654;</span>
            Active Managers ({managers.length})
          </button>

          {showManagers && managers.map((d) => (
            <div
              key={`${d.to_address}-${d.use_case}`}
              className="p-3 bg-gray-800 rounded border border-gray-700 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs break-all">{d.to_address}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Expires: {formatExpiry(d.expiry)}
                  </div>
                </div>
                <button
                  onClick={() => setConfirmRevoke(d)}
                  disabled={proposing}
                  className="text-xs text-danger hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              </div>

              {confirmRevoke && confirmRevoke.to_address === d.to_address && (
                <div className="p-3 rounded border space-y-2 text-xs bg-red-900/10 border-red-500/30">
                  <div className="font-medium text-red-300">
                    Confirm: Revoke delegation manager access?
                  </div>
                  <div className="font-mono break-all text-white bg-gray-900 rounded p-2">
                    {d.to_address}
                  </div>
                  <div className="text-red-200">
                    This wallet will no longer be able to manage delegations on behalf of this Safe.
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setConfirmRevoke(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleRevokeConfirmed(d)}
                      disabled={proposing}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {proposing ? 'Proposing...' : 'Confirm Revoke'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grant manager form */}
      <form onSubmit={handleGrant} className="space-y-3 pt-2 border-t border-gray-700">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Manager Address or ENS</label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => {
              setWalletAddress(e.target.value)
              setValidationError(null)
            }}
            placeholder="0x... or name.eth"
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
          />
          {ensResolving && (
            <div className="text-xs text-gray-400 mt-1">Resolving ENS...</div>
          )}
          {ensResolved && !ensResolving && (
            <div className="text-xs text-green-400 font-mono break-all mt-1">✓ {ensResolved}</div>
          )}
          {ensError && !ensResolving && (
            <div className="text-xs text-danger mt-1">{ensError}</div>
          )}
          {validationError && (
            <div className="text-xs text-danger mt-1">{validationError}</div>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Expiry</label>
          <div className="flex rounded overflow-hidden border border-gray-600 w-fit">
            <button
              type="button"
              onClick={() => setExpiryOption('forever')}
              className={`px-3 py-1 text-xs transition-colors ${
                expiryOption === 'forever'
                  ? 'bg-accent text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              Forever
            </button>
            <button
              type="button"
              onClick={() => setExpiryOption('1year')}
              className={`px-3 py-1 text-xs transition-colors border-l border-gray-600 ${
                expiryOption === '1year'
                  ? 'bg-accent text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              1 Year
            </button>
          </div>
        </div>

        {txError && <div className="text-xs text-danger">{txError}</div>}
        {safeTxHash && (
          <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded p-2">
            Tx proposed (hash: {safeTxHash.slice(0, 10)}...). It still needs Safe signer approval
            before it takes effect on-chain.
            <button type="button" onClick={reset} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        <button
          type="submit"
          disabled={proposing || !walletAddress || ensResolving || !!ensError}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
        >
          {proposing ? 'Proposing...' : ensResolving ? 'Resolving ENS...' : 'Grant Manager Access'}
        </button>
      </form>
    </div>
  )
}
