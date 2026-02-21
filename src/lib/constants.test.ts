import { describe, it, expect, vi } from 'vitest'
import {
  getCollectionName,
  isERC1155,
  displayTokenId,
  shortenAddress,
  formatExpiry,
} from './constants.ts'
import { CONTRACTS } from '../contracts/addresses.ts'

describe('getCollectionName', () => {
  it('returns name for known contracts', () => {
    expect(getCollectionName(CONTRACTS.THE_MEMES)).toBe('The Memes')
    expect(getCollectionName(CONTRACTS.GRADIENT)).toBe('6529 Gradient')
    expect(getCollectionName(CONTRACTS.NEXTGEN)).toBe('NextGen (Pebbles)')
  })

  it('returns "Unknown" for unknown contract', () => {
    expect(getCollectionName('0x0000000000000000000000000000000000000001')).toBe('Unknown')
  })

  it('is case insensitive', () => {
    expect(getCollectionName(CONTRACTS.THE_MEMES.toLowerCase())).toBe('The Memes')
    expect(getCollectionName(CONTRACTS.THE_MEMES.toUpperCase())).toBe('The Memes')
  })
})

describe('isERC1155', () => {
  it('returns true for The Memes contract', () => {
    expect(isERC1155(CONTRACTS.THE_MEMES)).toBe(true)
  })

  it('returns false for other contracts', () => {
    expect(isERC1155(CONTRACTS.GRADIENT)).toBe(false)
    expect(isERC1155(CONTRACTS.NEXTGEN)).toBe(false)
  })
})

describe('displayTokenId', () => {
  it('subtracts base for NextGen high token IDs', () => {
    expect(displayTokenId(CONTRACTS.NEXTGEN, 10000000042)).toBe(42)
  })

  it('passes through NextGen IDs below base', () => {
    expect(displayTokenId(CONTRACTS.NEXTGEN, 5)).toBe(5)
  })

  it('passes through IDs for other contracts', () => {
    expect(displayTokenId(CONTRACTS.THE_MEMES, 10000000042)).toBe(10000000042)
  })
})

describe('shortenAddress', () => {
  it('shortens to first 6 and last 4 characters', () => {
    expect(shortenAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe('0xd8dA...6045')
  })
})

describe('formatExpiry', () => {
  it('returns "Never" for zero', () => {
    expect(formatExpiry(0)).toBe('Never')
  })

  it('returns "Never" for falsy value', () => {
    expect(formatExpiry(undefined as unknown as number)).toBe('Never')
  })

  it('returns "Expired" for past timestamp', () => {
    // Jan 1, 2020
    expect(formatExpiry(1577836800)).toBe('Expired')
  })

  it('returns a date string for future timestamp', () => {
    // Use a far-future date: Jan 1, 2100
    const result = formatExpiry(4102444800)
    // Should be a date string, not "Never" or "Expired"
    expect(result).not.toBe('Never')
    expect(result).not.toBe('Expired')
    expect(result).toMatch(/\d/)
  })
})
