import { describe, it, expect } from 'vitest'
import { Interface } from 'ethers'
import {
  encodeRegisterDelegation,
  encodeRegisterDelegationUsingSubDelegation,
  encodeRevokeDelegation,
  encodeERC721Transfer,
  encodeERC1155Transfer,
} from './encoders.ts'
import { CONTRACTS } from './addresses.ts'
import { NFT_DELEGATION_ABI, ERC721_ABI, ERC1155_ABI } from './abis.ts'

const DUMMY_ADDR = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const DUMMY_ADDR2 = '0x1234567890AbcdEF1234567890aBcdef12345678'

const delegationIface = new Interface(NFT_DELEGATION_ABI)
const erc721Iface = new Interface(ERC721_ABI)
const erc1155Iface = new Interface(ERC1155_ABI)

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

  it('has the correct function selector', () => {
    const expected = delegationIface.getFunction('registerDelegationAddress')!.selector
    expect(tx.data.slice(0, 10)).toBe(expected)
  })

  it('encodes the correct arguments', () => {
    const decoded = delegationIface.decodeFunctionData('registerDelegationAddress', tx.data)
    expect(decoded[0].toLowerCase()).toBe(CONTRACTS.THE_MEMES.toLowerCase())
    expect(decoded[1].toLowerCase()).toBe(DUMMY_ADDR.toLowerCase())
    expect(decoded[2]).toBe(BigInt(0))
    expect(decoded[3]).toBe(BigInt(1))
    expect(decoded[4]).toBe(true)
    expect(decoded[5]).toBe(BigInt(0))
  })
})

describe('encodeRegisterDelegationUsingSubDelegation', () => {
  const tx = encodeRegisterDelegationUsingSubDelegation(
    DUMMY_ADDR2,
    CONTRACTS.THE_MEMES,
    DUMMY_ADDR,
    BigInt(1000),
    1,
    false,
    BigInt(42),
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

  it('has the correct function selector', () => {
    const expected = delegationIface.getFunction('registerDelegationAddressUsingSubDelegation')!.selector
    expect(tx.data.slice(0, 10)).toBe(expected)
  })

  it('encodes the correct arguments', () => {
    const decoded = delegationIface.decodeFunctionData(
      'registerDelegationAddressUsingSubDelegation',
      tx.data,
    )
    expect(decoded[0].toLowerCase()).toBe(DUMMY_ADDR2.toLowerCase())
    expect(decoded[1].toLowerCase()).toBe(CONTRACTS.THE_MEMES.toLowerCase())
    expect(decoded[2].toLowerCase()).toBe(DUMMY_ADDR.toLowerCase())
    expect(decoded[3]).toBe(BigInt(1000))
    expect(decoded[4]).toBe(BigInt(1))
    expect(decoded[5]).toBe(false)
    expect(decoded[6]).toBe(BigInt(42))
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

  it('has the correct function selector', () => {
    const expected = delegationIface.getFunction('revokeDelegationAddress')!.selector
    expect(tx.data.slice(0, 10)).toBe(expected)
  })

  it('encodes the correct arguments', () => {
    const decoded = delegationIface.decodeFunctionData('revokeDelegationAddress', tx.data)
    expect(decoded[0].toLowerCase()).toBe(CONTRACTS.THE_MEMES.toLowerCase())
    expect(decoded[1].toLowerCase()).toBe(DUMMY_ADDR.toLowerCase())
    expect(decoded[2]).toBe(BigInt(1))
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

  it('has the well-known ERC-721 safeTransferFrom selector', () => {
    expect(tx.data.slice(0, 10)).toBe('0x42842e0e')
  })

  it('selector matches ABI-derived value', () => {
    const expected = erc721Iface.getFunction('safeTransferFrom')!.selector
    expect(tx.data.slice(0, 10)).toBe(expected)
  })

  it('encodes the correct arguments', () => {
    const decoded = erc721Iface.decodeFunctionData('safeTransferFrom', tx.data)
    expect(decoded[0].toLowerCase()).toBe(DUMMY_ADDR.toLowerCase())
    expect(decoded[1].toLowerCase()).toBe(DUMMY_ADDR2.toLowerCase())
    expect(decoded[2]).toBe(BigInt(42))
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

  it('has the well-known ERC-1155 safeTransferFrom selector', () => {
    expect(tx.data.slice(0, 10)).toBe('0xf242432a')
  })

  it('selector matches ABI-derived value', () => {
    const expected = erc1155Iface.getFunction('safeTransferFrom')!.selector
    expect(tx.data.slice(0, 10)).toBe(expected)
  })

  it('encodes the correct arguments', () => {
    const decoded = erc1155Iface.decodeFunctionData('safeTransferFrom', tx.data)
    expect(decoded[0].toLowerCase()).toBe(DUMMY_ADDR.toLowerCase())
    expect(decoded[1].toLowerCase()).toBe(DUMMY_ADDR2.toLowerCase())
    expect(decoded[2]).toBe(BigInt(1))
    expect(decoded[3]).toBe(BigInt(1))
    expect(decoded[4]).toBe('0x')
  })
})
