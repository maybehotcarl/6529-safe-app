export interface SeizeProfile {
  handle: string
  primary_wallet: string
  pfp_url?: string
}

export interface SeizeConsolidation {
  tdh: number
  wallets: Array<{
    wallet: {
      address: string
      ens?: string
    }
  }>
}

export interface SeizeProfileResponse {
  profile: SeizeProfile | null
  consolidation: SeizeConsolidation | null
  cic?: { cic_rating: number }
  rep?: number
}

export interface SeizeNFT {
  id: number
  contract: string
  name: string
  description?: string
  image?: string
  thumbnail?: string
  animation?: string
  artist?: string
  supply?: number
  hodl_rate?: number
}

export interface SeizeOwnership {
  token_id: number
  contract: string
  balance: number
}

export interface OwnedNFT {
  tokenId: number
  contract: string
  name: string
  image: string
  thumbnail?: string
  artist?: string
  balance: number
  collection: string
}

export interface Delegation {
  block: number
  from_address: string
  to_address: string
  collection: string
  use_case: number
  expiry: number
  all_tokens: boolean
  token_id: number
}

export interface DelegationResponse {
  data: Delegation[]
  count: number
  next: string | null
}
