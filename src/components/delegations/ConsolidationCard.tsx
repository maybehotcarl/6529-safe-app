import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { useConsolidationStatus } from '../../hooks/useConsolidationStatus.ts'
import type { ConsolidationPair } from '../../hooks/useConsolidationStatus.ts'
import { ALL_COLLECTIONS_ADDRESS } from '../../contracts/addresses.ts'
import { encodeRegisterDelegation, encodeRevokeDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import { validateAddress } from '../../lib/validation.ts'
import { useENSResolution } from '../../hooks/useENSResolution.ts'
import { ONE_YEAR_SECS } from '../../lib/constants.ts'

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
      Incoming — verify address before accepting
    </span>
  )
}

interface Props {
  onDelegationChange: () => void
}

export default function ConsolidationCard({ onDelegationChange }: Props) {
  const { safe } = useSafeAppsSDK()
  const { pairs, loading, error, refresh } = useConsolidationStatus()
  const { loading: proposing, error: txError, safeTxHash, proposeTx, reset } = useProposeTx()

  const [walletAddress, setWalletAddress] = useState('')
  const [expiryOption, setExpiryOption] = useState<'forever' | '1year'>('forever')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [showPairs, setShowPairs] = useState(false)

  const { resolvedAddress: ensResolved, resolving: ensResolving, error: ensError } = useENSResolution(walletAddress)
  const effectiveWalletAddress = ensResolved ?? walletAddress

  // Confirmation state for accept/revoke
  const [confirmAction, setConfirmAction] = useState<{
    type: 'accept' | 'revoke'
    pair: ConsolidationPair
  } | null>(null)

  const getExpiry = () =>
    expiryOption === '1year'
      ? BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECS
      : 0n

  const handleConsolidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const result = validateAddress(effectiveWalletAddress, safe.safeAddress)
    if (!result.valid) {
      setValidationError(result.error)
      return
    }

    const expiry = getExpiry()

    const tx = encodeRegisterDelegation(
      ALL_COLLECTIONS_ADDRESS,
      result.address,
      expiry,
      999,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setWalletAddress('')
      setValidationError(null)
      refresh()
      onDelegationChange()
    }
  }

  const handleAcceptConfirmed = async (pair: ConsolidationPair) => {
    const expiry = getExpiry()

    const tx = encodeRegisterDelegation(
      ALL_COLLECTIONS_ADDRESS,
      pair.address,
      expiry,
      pair.useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    setConfirmAction(null)
    if (hash) {
      refresh()
      onDelegationChange()
    }
  }

  const handleRevokeConfirmed = async (pair: ConsolidationPair) => {
    const tx = encodeRevokeDelegation(
      ALL_COLLECTIONS_ADDRESS,
      pair.address,
      pair.useCase,
    )

    const hash = await proposeTx([tx])
    setConfirmAction(null)
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
        Link your Safe to another wallet so 6529 sees them as one identity (use case 999).
        Both wallets must register to each other for consolidation to take effect.
      </p>

      {/* Existing consolidation pairs */}
      {loading && (
        <div className="text-xs text-gray-400 py-2">Checking consolidation status...</div>
      )}

      {error && <div className="text-xs text-danger">{error}</div>}

      {!loading && pairs.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowPairs(!showPairs)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span className={`transition-transform ${showPairs ? 'rotate-90' : ''}`}>&#9654;</span>
            Active Consolidations ({pairs.length})
          </button>
          {showPairs && pairs.map((pair) => (
            <div
              key={`${pair.address}-${pair.useCase}`}
              className="p-3 bg-gray-800 rounded border border-gray-700 space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs break-all">{pair.address}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {pair.useCase === 998 ? 'Same Person' : 'Bi-directional'} (#{pair.useCase})
                  </div>
                </div>
                <PairStatus pair={pair} />
                <div className="flex gap-2">
                  {pair.incoming && !pair.outgoing && (
                    <button
                      onClick={() => setConfirmAction({ type: 'accept', pair })}
                      disabled={proposing}
                      className="text-xs text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                  )}
                  {pair.outgoing && (
                    <button
                      onClick={() => setConfirmAction({ type: 'revoke', pair })}
                      disabled={proposing}
                      className="text-xs text-danger hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>

              {/* Confirmation dialog for this pair */}
              {confirmAction && confirmAction.pair.address === pair.address && confirmAction.pair.useCase === pair.useCase && (
                <div className="p-3 rounded border space-y-2 text-xs"
                  style={{
                    backgroundColor: confirmAction.type === 'accept' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                    borderColor: confirmAction.type === 'accept' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)',
                  }}
                >
                  {confirmAction.type === 'accept' ? (
                    <>
                      <div className="font-medium text-blue-300">
                        Confirm: Accept consolidation from this wallet?
                      </div>
                      <div className="font-mono break-all text-white bg-gray-900 rounded p-2">
                        {pair.address}
                      </div>
                      <div className="text-blue-200">
                        Verify this is YOUR wallet. Accepting consolidation from an unknown address
                        merges their identity with your Safe — they would share your TDH, airdrops,
                        and voting power.
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-red-300">
                        Confirm: Revoke consolidation to this wallet?
                      </div>
                      <div className="font-mono break-all text-white bg-gray-900 rounded p-2">
                        {pair.address}
                      </div>
                      <div className="text-red-200">
                        This only revokes YOUR side of the consolidation.
                        The other wallet's delegation to you will remain active
                        until they revoke it separately.
                      </div>
                    </>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded px-3 py-1.5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        confirmAction.type === 'accept'
                          ? handleAcceptConfirmed(pair)
                          : handleRevokeConfirmed(pair)
                      }
                      disabled={proposing}
                      className={`flex-1 text-white rounded px-3 py-1.5 transition-colors disabled:opacity-50 ${
                        confirmAction.type === 'accept'
                          ? 'bg-blue-600 hover:bg-blue-500'
                          : 'bg-red-600 hover:bg-red-500'
                      }`}
                    >
                      {proposing ? 'Proposing...' : confirmAction.type === 'accept' ? 'Confirm Accept' : 'Confirm Revoke'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Consolidation form */}
      <form onSubmit={handleConsolidate} className="space-y-3 pt-2 border-t border-gray-700">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Wallet Address or ENS</label>
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
          {expiryOption === '1year' && (
            <div className="text-[10px] text-gray-500 mt-1">
              Consolidation will expire in 1 year. Renew by re-registering before expiry.
            </div>
          )}
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
          {proposing ? 'Proposing...' : ensResolving ? 'Resolving ENS...' : 'Consolidate'}
        </button>
      </form>
    </div>
  )
}
