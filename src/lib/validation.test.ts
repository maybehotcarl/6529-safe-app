import { describe, it, expect } from 'vitest'
import { validateAddress } from './validation.ts'

describe('validateAddress', () => {
  const SAFE_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

  it('accepts a valid checksummed address', () => {
    const result = validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    expect(result).toEqual({
      valid: true,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    })
  })

  it('accepts a valid lowercase address and returns checksummed', () => {
    const result = validateAddress('0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
    expect(result).toEqual({
      valid: true,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    })
  })

  it('rejects address that is too short', () => {
    const result = validateAddress('0x1234')
    expect(result).toEqual({ valid: false, error: 'Invalid Ethereum address format' })
  })

  it('rejects address missing 0x prefix', () => {
    const result = validateAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    expect(result).toEqual({ valid: false, error: 'Invalid Ethereum address format' })
  })

  it('rejects address with non-hex characters', () => {
    const result = validateAddress('0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ')
    expect(result).toEqual({ valid: false, error: 'Invalid Ethereum address format' })
  })

  it('rejects address with invalid checksum (mixed case but wrong)', () => {
    // Flip one letter's case to break checksum
    const result = validateAddress('0xD8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
    expect(result).toEqual({
      valid: false,
      error: 'Invalid address checksum. Please verify the address.',
    })
  })

  it('rejects the zero address', () => {
    const result = validateAddress('0x0000000000000000000000000000000000000000')
    expect(result).toEqual({ valid: false, error: 'Cannot use the zero address' })
  })

  it('rejects the Safe own address', () => {
    const result = validateAddress(SAFE_ADDRESS, SAFE_ADDRESS)
    expect(result).toEqual({ valid: false, error: 'Cannot use your own Safe address' })
  })

  it('trims whitespace', () => {
    const result = validateAddress('  0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  ')
    expect(result).toEqual({
      valid: true,
      address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    })
  })
})
