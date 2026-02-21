import { describe, it, expect } from 'vitest'
import {
  encodeRegisterDelegation,
  encodeRevokeDelegation,
  encodeERC721Transfer,
  encodeERC1155Transfer,
} from './encoders.ts'
import { CONTRACTS } from './addresses.ts'

const DUMMY_ADDR = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const DUMMY_ADDR2 = '0x1234567890AbcdEF1234567890aBcdef12345678'

describe('encodeRegisterDelegation', () => {
  const tx = encodeRegisterDelegation(
    CONTRACTS.THE_MEMES,
    DUMMY_ADDR,
    BigInt(0),
    1,
    true,
    BigInt(0),
  )

  it('targets the NFT delegation contract', () => {
    expect(tx.to).toBe(CONTRACTS.NFT_DELEGATION)
  })

  it('has value of "0"', () => {
    expect(tx.value).toBe('0')
  })

  it('returns valid hex data', () => {
    expect(tx.data).toMatch(/^0x[0-9a-fA-F]+$/)
  })
})

describe('encodeRevokeDelegation', () => {
  const tx = encodeRevokeDelegation(CONTRACTS.THE_MEMES, DUMMY_ADDR, 1)

  it('targets the NFT delegation contract', () => {
    expect(tx.to).toBe(CONTRACTS.NFT_DELEGATION)
  })

  it('has value of "0"', () => {
    expect(tx.value).toBe('0')
  })

  it('returns valid hex data', () => {
    expect(tx.data).toMatch(/^0x[0-9a-fA-F]+$/)
  })
})

describe('encodeERC721Transfer', () => {
  const contract = CONTRACTS.GRADIENT
  const tx = encodeERC721Transfer(contract, DUMMY_ADDR, DUMMY_ADDR2, BigInt(42))

  it('targets the passed contract address', () => {
    expect(tx.to).toBe(contract)
  })

  it('has value of "0"', () => {
    expect(tx.value).toBe('0')
  })

  it('returns valid hex data', () => {
    expect(tx.data).toMatch(/^0x[0-9a-fA-F]+$/)
  })
})

describe('encodeERC1155Transfer', () => {
  const contract = CONTRACTS.THE_MEMES
  const tx = encodeERC1155Transfer(contract, DUMMY_ADDR, DUMMY_ADDR2, BigInt(1), BigInt(1))

  it('targets the passed contract address', () => {
    expect(tx.to).toBe(contract)
  })

  it('has value of "0"', () => {
    expect(tx.value).toBe('0')
  })

  it('returns valid hex data', () => {
    expect(tx.data).toMatch(/^0x[0-9a-fA-F]+$/)
  })
})
