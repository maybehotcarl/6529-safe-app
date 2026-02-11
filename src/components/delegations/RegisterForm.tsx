import { useState } from 'react'
import { USE_CASES, COLLECTION_OPTIONS } from '../../lib/constants.ts'
import { encodeRegisterDelegation } from '../../contracts/encoders.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'

interface Props {
  onSuccess: () => void
}

export default function RegisterForm({ onSuccess }: Props) {
  const [delegateAddress, setDelegateAddress] = useState('')
  const [useCase, setUseCase] = useState(1)
  const [collection, setCollection] = useState(COLLECTION_OPTIONS[0].address)
  const [expiryDate, setExpiryDate] = useState('')
  const { loading, error, safeTxHash, proposeTx, reset } = useProposeTx()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!delegateAddress.match(/^0x[0-9a-fA-F]{40}$/)) {
      alert('Invalid Ethereum address')
      return
    }

    const expiry = expiryDate
      ? BigInt(Math.floor(new Date(expiryDate).getTime() / 1000))
      : 0n

    const tx = encodeRegisterDelegation(
      collection,
      delegateAddress,
      expiry,
      useCase,
      true,
      0n,
    )

    const hash = await proposeTx([tx])
    if (hash) {
      setDelegateAddress('')
      setExpiryDate('')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Register Delegation</h3>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Delegate Address</label>
        <input
          type="text"
          value={delegateAddress}
          onChange={e => setDelegateAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
        />
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
        <label className="block text-xs text-gray-400 mb-1">Expiry Date (optional)</label>
        <input
          type="date"
          value={expiryDate}
          onChange={e => setExpiryDate(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {error && <div className="text-xs text-danger">{error}</div>}
      {safeTxHash && (
        <div className="text-xs text-success">
          Tx proposed! Hash: {safeTxHash.slice(0, 10)}...
          <button type="button" onClick={reset} className="ml-2 underline">OK</button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !delegateAddress}
        className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
      >
        {loading ? 'Proposing...' : 'Register Delegation'}
      </button>
    </form>
  )
}
