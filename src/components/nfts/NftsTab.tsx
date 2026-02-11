import { useState } from 'react'
import { useOwnedNfts } from '../../hooks/useOwnedNfts.ts'
import { CONTRACTS } from '../../contracts/addresses.ts'
import NftCard from './NftCard.tsx'

const FILTERS = [
  { label: 'All', contract: undefined },
  { label: 'Memes', contract: CONTRACTS.THE_MEMES },
  { label: 'Gradients', contract: CONTRACTS.GRADIENT },
  { label: 'Pebbles', contract: CONTRACTS.NEXTGEN },
] as const

export default function NftsTab() {
  const [filterContract, setFilterContract] = useState<string | undefined>(undefined)
  const { nfts, loading, error, refresh } = useOwnedNfts(filterContract)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <button
          onClick={refresh}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-800" />
              <div className="p-2 space-y-1">
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-sm text-danger py-4">{error}</div>}

      {!loading && !error && nfts.length === 0 && (
        <div className="text-sm text-gray-400 py-12 text-center border border-gray-700 rounded-lg">
          No NFTs found in this Safe
        </div>
      )}

      {!loading && nfts.length > 0 && (
        <>
          <div className="text-xs text-gray-400">{nfts.length} NFTs</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {nfts.map(nft => (
              <NftCard key={`${nft.contract}-${nft.tokenId}`} nft={nft} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
