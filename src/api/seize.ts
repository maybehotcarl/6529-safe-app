import type { SeizeProfileResponse, OwnedNFT, Delegation } from './types.ts'
import { CONTRACTS } from '../contracts/addresses.ts'
import { getCollectionName } from '../lib/constants.ts'

const SEIZE_API = 'https://api.6529.io'

export async function fetchProfile(address: string): Promise<SeizeProfileResponse | null> {
  try {
    const res = await fetch(`${SEIZE_API}/api/profiles/${address}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchOwnedNfts(
  address: string,
  contract?: string,
): Promise<OwnedNFT[]> {
  try {
    let url = `${SEIZE_API}/api/nfts/owners?wallet=${address}`
    if (contract) url += `&contract=${contract}`
    url += '&page_size=200'

    const allNfts: OwnedNFT[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const res = await fetch(`${url}&page=${page}`)
      if (!res.ok) break

      const data = await res.json()
      const items = data.data || data || []

      for (const item of items) {
        allNfts.push({
          tokenId: item.token_id ?? item.id,
          contract: item.contract,
          name: item.name || `#${item.token_id ?? item.id}`,
          image: item.image || item.thumbnail || '',
          thumbnail: item.thumbnail,
          artist: item.artist,
          balance: item.balance ?? 1,
          collection: getCollectionName(item.contract),
        })
      }

      hasMore = data.next !== null && data.next !== undefined && items.length > 0
      page++
      if (page > 20) break
    }

    return allNfts
  } catch (e) {
    console.error('Error fetching owned NFTs:', e)
    return []
  }
}

export async function fetchDelegations(address: string): Promise<Delegation[]> {
  try {
    const res = await fetch(
      `${SEIZE_API}/api/delegations?wallet=${address}&page_size=200`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (e) {
    console.error('Error fetching delegations:', e)
    return []
  }
}

export async function fetchIncomingDelegations(address: string): Promise<Delegation[]> {
  try {
    const res = await fetch(
      `${SEIZE_API}/api/delegations?to_address=${address}&page_size=200`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (e) {
    console.error('Error fetching incoming delegations:', e)
    return []
  }
}

export const COLLECTION_CONTRACTS = [
  CONTRACTS.THE_MEMES,
  CONTRACTS.GRADIENT,
  CONTRACTS.NEXTGEN,
] as const
