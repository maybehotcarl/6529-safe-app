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
    let url = `${SEIZE_API}/api/owners/${address}/nfts`
    if (contract) url += `?contract=${contract}`

    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()
    const items = data.data || data || []

    return items
      .filter((item: Record<string, unknown>) => item.id !== undefined)
      .map((item: Record<string, unknown>) => ({
        tokenId: (item.token_id ?? item.id) as number,
        contract: item.contract as string,
        name: (item.name || `#${item.token_id ?? item.id}`) as string,
        image: (item.image || item.thumbnail || '') as string,
        thumbnail: item.thumbnail as string | undefined,
        artist: item.artist as string | undefined,
        balance: (item.balance ?? 1) as number,
        collection: getCollectionName(item.contract as string),
      }))
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
