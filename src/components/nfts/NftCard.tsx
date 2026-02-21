import type { OwnedNFT } from '../../api/types.ts'
import { displayTokenId } from '../../lib/constants.ts'

type Props = { nft: OwnedNFT } & (
  | { selectable: true; selected: boolean; onToggle: () => void }
  | { selectable?: false; selected?: never; onToggle?: never }
)

export default function NftCard({ nft, selected, onToggle, selectable }: Props) {
  return (
    <div
      onClick={selectable ? onToggle : undefined}
      className={`
        bg-gray-900 rounded-lg border overflow-hidden transition-all
        ${selected ? 'border-accent ring-1 ring-accent' : 'border-gray-700'}
        ${selectable ? 'cursor-pointer hover:border-gray-500' : ''}
      `}
    >
      <div className="aspect-square bg-gray-800 relative">
        {nft.image ? (
          <img
            src={nft.thumbnail || nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
            No image
          </div>
        )}
        {selectable && selected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-xs">
            ✓
          </div>
        )}
        {nft.balance > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/80 rounded px-1.5 py-0.5 text-xs font-mono">
            x{nft.balance}
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="text-xs font-medium truncate">{nft.name}</div>
        <div className="text-xs text-gray-400 truncate">
          {nft.collection} #{displayTokenId(nft.contract, nft.tokenId)}
        </div>
      </div>
    </div>
  )
}
