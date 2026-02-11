import type { SeizeProfileResponse, OwnedNFT, Delegation } from './types.ts'
import { CONTRACTS } from '../contracts/addresses.ts'
import { getCollectionName } from '../lib/constants.ts'

const SEIZE_API = 'https://api.6529.io'

/** Map contract address → API collection filter name */
const CONTRACT_TO_COLLECTION: Record<string, string> = {
  [CONTRACTS.THE_MEMES.toLowerCase()]: 'MEMES',
  [CONTRACTS.GRADIENT.toLowerCase()]: 'GRADIENTS',
}

/** Map API collection name → contract address */
const COLLECTION_TO_CONTRACT: Record<string, string> = {
  MEMES: CONTRACTS.THE_MEMES,
  GRADIENTS: CONTRACTS.GRADIENT,
  NEXTGEN: CONTRACTS.NEXTGEN,
}

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
    const allItems: OwnedNFT[] = []
    const pageSize = 200
    let page = 1

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let url = `${SEIZE_API}/api/profiles/${address}/collected?seized=SEIZED&account_for_consolidations=false&page_size=${pageSize}&page=${page}`

      if (contract) {
        const collectionName = CONTRACT_TO_COLLECTION[contract.toLowerCase()]
        if (collectionName) url += `&collection=${collectionName}`
      }

      const res = await fetch(url)
      if (!res.ok) return allItems

      const data = await res.json()
      const items: Record<string, unknown>[] = data.data || []

      for (const item of items) {
        const contractAddr = COLLECTION_TO_CONTRACT[item.collection as string]
        if (!contractAddr) continue // skip unsupported collections (e.g. MEMELAB)

        allItems.push({
          tokenId: item.token_id as number,
          contract: contractAddr,
          name: (item.token_name as string) || `#${item.token_id}`,
          image: (item.img as string) || '',
          thumbnail: item.img as string | undefined,
          artist: undefined,
          balance: (item.seized_count as number) ?? 1,
          collection: getCollectionName(contractAddr),
        })
      }

      if (!data.next || items.length < pageSize) break
      page++
    }

    return allItems
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
