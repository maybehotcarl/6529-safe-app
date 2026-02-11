import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { useOwnedNfts } from '../../hooks/useOwnedNfts.ts'
import { useProposeTx } from '../../hooks/useProposeTx.ts'
import { encodeERC721Transfer, encodeERC1155Transfer } from '../../contracts/encoders.ts'
import { isERC1155 } from '../../lib/constants.ts'
import { CONTRACTS } from '../../contracts/addresses.ts'
import NftCard from '../nfts/NftCard.tsx'
import type { OwnedNFT } from '../../api/types.ts'

const FILTERS = [
  { label: 'All', contract: undefined },
  { label: 'Memes', contract: CONTRACTS.THE_MEMES },
  { label: 'Gradients', contract: CONTRACTS.GRADIENT },
  { label: 'Pebbles', contract: CONTRACTS.NEXTGEN },
] as const

interface SelectedNft {
  nft: OwnedNFT
  quantity: number
}

export default function TransferTab() {
  const { safe } = useSafeAppsSDK()
  const [filterContract, setFilterContract] = useState<string | undefined>(undefined)
  const { nfts, loading } = useOwnedNfts(filterContract)
  const { loading: sending, error, safeTxHash, proposeTx, reset } = useProposeTx()

  const [selected, setSelected] = useState<Map<string, SelectedNft>>(new Map())
  const [recipient, setRecipient] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const nftKey = (nft: OwnedNFT) => `${nft.contract}-${nft.tokenId}`

  const toggleSelect = (nft: OwnedNFT) => {
    const key = nftKey(nft)
    const next = new Map(selected)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.set(key, { nft, quantity: nft.balance })
    }
    setSelected(next)
  }

  const updateQuantity = (key: string, qty: number) => {
    const next = new Map(selected)
    const entry = next.get(key)
    if (entry) {
      next.set(key, { ...entry, quantity: Math.max(1, Math.min(qty, entry.nft.balance)) })
      setSelected(next)
    }
  }

  const handleTransfer = async () => {
    if (!recipient.match(/^0x[0-9a-fA-F]{40}$/)) {
      alert('Invalid recipient address')
      return
    }

    const txs = Array.from(selected.values()).map(({ nft, quantity }) => {
      if (isERC1155(nft.contract)) {
        return encodeERC1155Transfer(
          nft.contract,
          safe.safeAddress,
          recipient,
          BigInt(nft.tokenId),
          BigInt(quantity),
        )
      }
      return encodeERC721Transfer(
        nft.contract,
        safe.safeAddress,
        recipient,
        BigInt(nft.tokenId),
      )
    })

    const hash = await proposeTx(txs)
    if (hash) {
      setSelected(new Map())
      setRecipient('')
      setShowConfirm(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Recipient */}
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
        <label className="block text-xs text-gray-400">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={e => setRecipient(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-accent"
        />
      </div>

      {/* Collection Filter */}
      <div className="flex gap-2">
        {FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setFilterContract(f.contract)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              filterContract === f.contract
                ? 'bg-accent text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* NFT grid */}
      {loading ? (
        <div className="text-sm text-gray-400 py-8 text-center">Loading NFTs...</div>
      ) : nfts.length === 0 ? (
        <div className="text-sm text-gray-400 py-8 text-center border border-gray-700 rounded-lg">
          No NFTs found
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {nfts.map(nft => (
            <NftCard
              key={nftKey(nft)}
              nft={nft}
              selectable
              selected={selected.has(nftKey(nft))}
              onToggle={() => toggleSelect(nft)}
            />
          ))}
        </div>
      )}

      {/* Selected items & quantities */}
      {selected.size > 0 && (
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
          <h3 className="text-sm font-bold text-gray-300">
            Selected ({selected.size})
          </h3>
          <div className="space-y-2">
            {Array.from(selected.entries()).map(([key, { nft, quantity }]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">
                  {nft.name} <span className="text-gray-400">#{nft.tokenId}</span>
                </span>
                {isERC1155(nft.contract) && nft.balance > 1 && (
                  <div className="flex items-center gap-2 ml-3">
                    <label className="text-xs text-gray-400">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      max={nft.balance}
                      value={quantity}
                      onChange={e => updateQuantity(key, parseInt(e.target.value) || 1)}
                      className="w-16 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-center focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-gray-400">/ {nft.balance}</span>
                  </div>
                )}
                <button
                  onClick={() => {
                    const next = new Map(selected)
                    next.delete(key)
                    setSelected(next)
                  }}
                  className="ml-3 text-xs text-gray-400 hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {error && <div className="text-xs text-danger">{error}</div>}
          {safeTxHash && (
            <div className="text-xs text-success">
              Tx proposed! Hash: {safeTxHash.slice(0, 10)}...
              <button type="button" onClick={reset} className="ml-2 underline">OK</button>
            </div>
          )}

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={!recipient || selected.size === 0}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              Review Transfer
            </button>
          ) : (
            <div className="space-y-3 p-3 bg-gray-800 rounded border border-yellow-400/30">
              <div className="text-xs text-yellow-400">
                Confirm: Transfer {selected.size} NFT{selected.size > 1 ? 's' : ''} to{' '}
                <span className="font-mono">{recipient.slice(0, 8)}...{recipient.slice(-4)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded px-4 py-2 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={sending}
                  className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium transition-colors"
                >
                  {sending ? 'Proposing...' : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
