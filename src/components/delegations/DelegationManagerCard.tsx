import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { USE_CASES, COLLECTION_OPTIONS } from '../../lib/constants.ts'
import { encodeRegisterDelegationUsingSubDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import { validateAddress } from '../../lib/validation.ts'

interface Props {
  onSuccess: () => void
}

export default function DelegationManagerCard({ onSuccess }: Props) {
  const { safe } = useSafeAppsSDK()
  const { loading, error, safeTxHash, proposeTx, reset } = useProposeTx()

  const [delegatorAddress, setDelegatorAddress] = useState('')
  const [delegateAddress, setDelegateAddress] = useState('')
  const [useCase, setUseCase] = useState(1)
  const [collection, setCollection] = useState(COLLECTION_OPTIONS[0].address)
  const [expiryOption, setExpiryOption] = useState<'forever' | '1year'>('forever')
  const [delegatorError, setDelegatorError] = useState<string | null>(null)
  const [delegateError, setDelegateError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDelegatorError(null)
    setDelegateError(null)

    const delegatorResult = validateAddress(delegatorAddress, safe.safeAddress)
    if (!delegatorResult.valid) {
      setDelegatorError(delegatorResult.error)
      return
    }

    const delegateResult = validateAddress(delegateAddress, safe.safeAddress)
    if (!delegateResult.valid) {
      setDelegateError(delegateResult.error)
      return
    }

    const ONE_YEAR = BigInt(365 * 24 * 60 * 60)
    const expiry = expiryOption === '1year'
      ? BigInt(Math.floor(Date.now() / 1000)) + ONE_YEAR
      : 0n

    const tx = encodeRegisterDelegationUsingSubDelegation(
      delegatorResult.address,
      collection,
      delegateResult.address,
      expiry,
      useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setDelegatorAddress('')
      setDelegateAddress('')
      setExpiryOption('forever')
      setDelegatorError(null)
      setDelegateError(null)
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">
          Delegation Manager
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          If a vault wallet has granted this Safe delegation manager rights, use this to register
          delegations on their behalf without the vault needing to sign.
        </p>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Vault Address (delegator)</label>
        <input
          type="text"
          value={delegatorAddress}
          onChange={e => {
            setDelegatorAddress(e.target.value)
            setDelegatorError(null)
          }}
          placeholder="0x... (the wallet that granted this Safe manager rights)"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
        />
        {delegatorError && (
          <div className="text-xs text-danger mt-1">{delegatorError}</div>
        )}
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Delegate Address</label>
        <input
          type="text"
          value={delegateAddress}
          onChange={e => {
            setDelegateAddress(e.target.value)
            setDelegateError(null)
          }}
          placeholder="0x... (the wallet to delegate to)"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
        />
        {delegateError && (
          <div className="text-xs text-danger mt-1">{delegateError}</div>
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
              .filter(([id]) => id !== '998' && id !== '999')
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
        disabled={loading || !delegatorAddress || !delegateAddress}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
      >
        {loading ? 'Proposing...' : 'Register Delegation via Manager'}
      </button>
    </form>
  )
}
