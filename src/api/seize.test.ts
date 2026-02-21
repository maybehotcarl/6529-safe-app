import { describe, it, expect } from 'vitest'
import { isDelegation } from './seize.ts'

const VALID_DELEGATION = {
  block: 100,
  from_address: '0xabc',
  to_address: '0xdef',
  collection: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
  use_case: 1,
  expiry: 0,
  all_tokens: true,
  token_id: 0,
}

describe('isDelegation', () => {
  it('accepts a valid delegation object', () => {
    expect(isDelegation(VALID_DELEGATION)).toBe(true)
  })

  it('accepts with extra fields', () => {
    expect(isDelegation({ ...VALID_DELEGATION, extra_field: 'ignored' })).toBe(true)
  })

  it('rejects null', () => {
    expect(isDelegation(null)).toBe(false)
  })

  it('rejects undefined', () => {
    expect(isDelegation(undefined)).toBe(false)
  })

  it('rejects a string', () => {
    expect(isDelegation('not an object')).toBe(false)
  })

  it('rejects an empty object', () => {
    expect(isDelegation({})).toBe(false)
  })

  it('rejects when block is missing', () => {
    const { block: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when from_address is missing', () => {
    const { from_address: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when to_address is missing', () => {
    const { to_address: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when collection is missing', () => {
    const { collection: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when use_case is missing', () => {
    const { use_case: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when expiry is missing', () => {
    const { expiry: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when all_tokens is missing', () => {
    const { all_tokens: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when token_id is missing', () => {
    const { token_id: _, ...rest } = VALID_DELEGATION
    expect(isDelegation(rest)).toBe(false)
  })

  it('rejects when block is a string', () => {
    expect(isDelegation({ ...VALID_DELEGATION, block: '100' })).toBe(false)
  })

  it('rejects when from_address is a number', () => {
    expect(isDelegation({ ...VALID_DELEGATION, from_address: 123 })).toBe(false)
  })

  it('rejects when use_case is a string', () => {
    expect(isDelegation({ ...VALID_DELEGATION, use_case: '1' })).toBe(false)
  })

  it('rejects when all_tokens is a number', () => {
    expect(isDelegation({ ...VALID_DELEGATION, all_tokens: 1 })).toBe(false)
  })

  it('rejects when expiry is a string', () => {
    expect(isDelegation({ ...VALID_DELEGATION, expiry: 'never' })).toBe(false)
  })

  it('rejects when token_id is a string', () => {
    expect(isDelegation({ ...VALID_DELEGATION, token_id: '0' })).toBe(false)
  })

  it('rejects an array', () => {
    expect(isDelegation([VALID_DELEGATION])).toBe(false)
  })
})
