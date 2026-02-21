import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { USE_CASES, COLLECTION_OPTIONS, ONE_YEAR_SECS, USE_CASE_DELEGATION_MANAGER, USE_CASE_CONSOLIDATION } from '../../lib/constants.ts'
import { encodeRegisterDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import { validateAddress } from '../../lib/validation.ts'
import { useENSResolution } from '../../hooks/useENSResolution.ts'

interface Props {
  onSuccess: () => void
}

export default function RegisterForm({ onSuccess }: Props) {
  const { safe } = useSafeAppsSDK()
  const [delegateAddress, setDelegateAddress] = useState('')
  const [useCase, setUseCase] = useState(1)
  const [collection, setCollection] = useState(COLLECTION_OPTIONS[0].address)
  const [expiryOption, setExpiryOption] = useState<'forever' | '1year'>('forever')
  const [validationError, setValidationError] = useState<string | null>(null)
  const { loading, error, safeTxHash, proposeTx, reset } = useProposeTx()

  const { resolvedAddress: ensResolved, resolving: ensResolving, error: ensError } = useENSResolution(delegateAddress)
  const effectiveDelegate = ensResolved ?? delegateAddress

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (safe.chainId !== 1) {
      setValidationError('Wrong network — switch your Safe to Ethereum Mainnet (chain 1)')
      return
    }

    const result = validateAddress(effectiveDelegate, safe.safeAddress)
    if (!result.valid) {
      setValidationError(result.error)
      return
    }

    const expiry = expiryOption === '1year'
      ? BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR_SECS
      : 0n

    const tx = encodeRegisterDelegation(
      collection,
      result.address,
      expiry,
      useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setDelegateAddress('')
      setExpiryOption('forever')
      setValidationError(null)
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Register Delegation</h3>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Delegate Address or ENS</label>
        <input
          type="text"
          value={delegateAddress}
          onChange={e => {
            setDelegateAddress(e.target.value)
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Use Case</label>
          <select
            value={useCase}
            onChange={e => setUseCase(Number(e.target.value))}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {Object.entries(USE_CASES)
              .filter(([id]) => id !== String(USE_CASE_DELEGATION_MANAGER) && id !== String(USE_CASE_CONSOLIDATION))
              .map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Collection</label>
          <select
            value={collection}
            onChange={e => setCollection(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {COLLECTION_OPTIONS.map(opt => (
              <option key={opt.address} value={opt.address}>{opt.label}</option>
            ))}
          </select>
        </div>
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

      {error && <div className="text-xs text-danger">{error}</div>}
      {safeTxHash && (
        <div className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded p-2">
          Tx proposed (hash: {safeTxHash.slice(0, 10)}...). It still needs Safe signer approval
          before it takes effect on-chain.
          <button type="button" onClick={reset} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !delegateAddress || ensResolving || !!ensError}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
      >
        {loading ? 'Proposing...' : ensResolving ? 'Resolving ENS...' : 'Register Delegation'}
      </button>
    </form>
  )
}
