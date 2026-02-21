import { CONTRACTS, ALL_COLLECTIONS_ADDRESS } from '../contracts/addresses.ts'

export const USE_CASES: Record<number, string> = {
  1: 'All',
  2: 'Minting / Allowlist',
  3: 'Airdrops',
  4: 'Voting / Governance',
  5: 'Avatar Display',
  6: 'Social Media',
  7: 'Physical Events',
  8: 'Virtual Events',
  9: 'Club Access',
  10: 'Metaverse',
  11: 'Gaming / PFP',
  12: 'Physical Merch',
  13: 'Legal',
  14: 'Community Grants',
  15: 'Music',
  16: 'View / Display',
  17: 'Sub-Delegation',
  18: 'NFT Utilities',
  19: 'Data / Analytics',
  998: 'Delegation Management',
  999: 'Consolidation',
}

export const COLLECTION_OPTIONS: { label: string; address: string }[] = [
  { label: 'All Collections', address: ALL_COLLECTIONS_ADDRESS },
  { label: 'The Memes', address: CONTRACTS.THE_MEMES },
  { label: '6529 Gradient', address: CONTRACTS.GRADIENT },
  { label: 'NextGen (Pebbles)', address: CONTRACTS.NEXTGEN },
]

export const COLLECTION_NAMES: Record<string, string> = {
  [CONTRACTS.THE_MEMES.toLowerCase()]: 'The Memes',
  [CONTRACTS.GRADIENT.toLowerCase()]: '6529 Gradient',
  [CONTRACTS.NEXTGEN.toLowerCase()]: 'NextGen (Pebbles)',
}

export function getCollectionName(contract: string): string {
  return COLLECTION_NAMES[contract.toLowerCase()] ?? 'Unknown'
}

export function isERC1155(contract: string): boolean {
  return contract.toLowerCase() === CONTRACTS.THE_MEMES.toLowerCase()
}

const PEBBLES_BASE_TOKEN_ID = 10000000000

export function displayTokenId(contract: string, tokenId: number): number {
  if (contract.toLowerCase() === CONTRACTS.NEXTGEN.toLowerCase() && tokenId >= PEBBLES_BASE_TOKEN_ID) {
    return tokenId - PEBBLES_BASE_TOKEN_ID
  }
  return tokenId
}

export const ONE_YEAR_SECS = BigInt(365 * 24 * 60 * 60)

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatExpiry(timestamp: number): string {
  if (!timestamp || timestamp === 0) return 'Never'
  const date = new Date(timestamp * 1000)
  if (date.getTime() < Date.now()) return 'Expired'
  return date.toLocaleDateString()
}
