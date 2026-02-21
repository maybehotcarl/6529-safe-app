import type { SeizeProfileResponse, OwnedNFT, Delegation } from './types.ts'
import { CONTRACTS } from '../contracts/addresses.ts'
import { getCollectionName } from '../lib/constants.ts'

const SEIZE_API = import.meta.env.VITE_SEIZE_API_URL || 'https://api.6529.io'

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

/** Safely parse JSON from a Response, returning null on failure */
async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Generic paginated fetch. Calls `baseUrl` with page_size/page params,
 * parses JSON safely, and passes `data` array items through `transform`.
 */
async function fetchAllPages<T>(
  baseUrl: string,
  transform: (items: unknown[]) => T[],
  options?: { pageSize?: number; maxPages?: number; separator?: string },
): Promise<T[]> {
  const pageSize = options?.pageSize ?? 200
  const maxPages = options?.maxPages ?? 50
  const sep = options?.separator ?? (baseUrl.includes('?') ? '&' : '?')
  const allItems: T[] = []
  let page = 1

  while (page <= maxPages) {
    const url = `${baseUrl}${sep}page_size=${pageSize}&page=${page}`
    const res = await fetch(url)
    if (!res.ok) return allItems

    const json = await safeJson(res)
    if (!json || typeof json !== 'object') return allItems

    const data = (json as Record<string, unknown>).data
    if (!Array.isArray(data)) return allItems

    const transformed = transform(data)
    allItems.push(...transformed)

    const hasNext = (json as Record<string, unknown>).next
    if (!hasNext || data.length < pageSize) break
    page++
  }

  return allItems
}

export async function fetchProfile(address: string): Promise<SeizeProfileResponse | null> {
  try {
    const res = await fetch(`${SEIZE_API}/api/profiles/${address}`)
    if (!res.ok) return null
    const json = await safeJson(res)
    if (!json || typeof json !== 'object') return null
    return json as SeizeProfileResponse
  } catch {
    return null
  }
}

export async function fetchOwnedNfts(
  address: string,
  contract?: string,
): Promise<OwnedNFT[]> {
  try {
    let baseUrl = `${SEIZE_API}/api/profiles/${address}/collected?seized=SEIZED&account_for_consolidations=false`

    if (contract) {
      const collectionName = CONTRACT_TO_COLLECTION[contract.toLowerCase()]
      if (collectionName) baseUrl += `&collection=${collectionName}`
    }

    return await fetchAllPages<OwnedNFT>(baseUrl, (items) => {
      const result: OwnedNFT[] = []
      for (const item of items) {
        if (!item || typeof item !== 'object') continue
        const rec = item as Record<string, unknown>

        const contractAddr = COLLECTION_TO_CONTRACT[rec.collection as string]
        if (!contractAddr) continue // skip unsupported collections (e.g. MEMELAB)

        const tokenId = rec.token_id
        if (typeof tokenId !== 'number') continue

        result.push({
          tokenId,
          contract: contractAddr,
          name: (rec.token_name as string) || `#${tokenId}`,
          image: (rec.img as string) || '',
          thumbnail: rec.img as string | undefined,
          artist: undefined,
          balance: (rec.seized_count as number) ?? 1,
          collection: getCollectionName(contractAddr),
        })
      }
      return result
    })
  } catch {
    return []
  }
}

export async function fetchDelegations(address: string): Promise<Delegation[]> {
  try {
    return await fetchAllPages<Delegation>(
      `${SEIZE_API}/api/delegations?wallet=${address}`,
      (items) => items.filter((d): d is Delegation => d != null && typeof d === 'object'),
    )
  } catch {
    return []
  }
}

export async function fetchIncomingDelegations(address: string): Promise<Delegation[]> {
  try {
    return await fetchAllPages<Delegation>(
      `${SEIZE_API}/api/delegations?to_address=${address}`,
      (items) => items.filter((d): d is Delegation => d != null && typeof d === 'object'),
    )
  } catch {
    return []
  }
}

export const COLLECTION_CONTRACTS = [
  CONTRACTS.THE_MEMES,
  CONTRACTS.GRADIENT,
  CONTRACTS.NEXTGEN,
] as const
