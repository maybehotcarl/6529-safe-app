import { describe, it, expect } from 'vitest'
import { buildPairs, isConsolidation } from './useConsolidationStatus.ts'
import type { Delegation } from '../api/types.ts'

function makeDelegation(overrides: Partial<Delegation>): Delegation {
  return {
    block: 1,
    from_address: '0xABC',
    to_address: '0xDEF',
    collection: '0x33FD426905F149f8376e227d0C9D3340AaD17aF1',
    use_case: 999,
    expiry: 0,
    all_tokens: true,
    token_id: 0,
    ...overrides,
  }
}

describe('isConsolidation', () => {
  it('returns true for use_case 999', () => {
    expect(isConsolidation(makeDelegation({ use_case: 999 }))).toBe(true)
  })

  it('returns false for other use cases', () => {
    expect(isConsolidation(makeDelegation({ use_case: 1 }))).toBe(false)
    expect(isConsolidation(makeDelegation({ use_case: 0 }))).toBe(false)
  })
})

describe('buildPairs', () => {
  it('creates outgoing-only pair', () => {
    const out = [makeDelegation({ to_address: '0xAAA', use_case: 999 })]
    const pairs = buildPairs(out, [])
    expect(pairs).toEqual([
      { address: '0xAAA', useCase: 999, outgoing: true, incoming: false },
    ])
  })

  it('creates incoming-only pair', () => {
    const inc = [makeDelegation({ from_address: '0xBBB', use_case: 999 })]
    const pairs = buildPairs([], inc)
    expect(pairs).toEqual([
      { address: '0xBBB', useCase: 999, outgoing: false, incoming: true },
    ])
  })

  it('creates bidirectional pair when address appears in both', () => {
    const out = [makeDelegation({ to_address: '0xCCC', use_case: 999 })]
    const inc = [makeDelegation({ from_address: '0xCCC', use_case: 999 })]
    const pairs = buildPairs(out, inc)
    expect(pairs).toEqual([
      { address: '0xCCC', useCase: 999, outgoing: true, incoming: true },
    ])
  })

  it('matches addresses case-insensitively', () => {
    const out = [makeDelegation({ to_address: '0xAbCdEf', use_case: 999 })]
    const inc = [makeDelegation({ from_address: '0xABCDEF', use_case: 999 })]
    const pairs = buildPairs(out, inc)
    expect(pairs).toHaveLength(1)
    expect(pairs[0].outgoing).toBe(true)
    expect(pairs[0].incoming).toBe(true)
  })

  it('separates different use cases for same address', () => {
    const out = [
      makeDelegation({ to_address: '0xDDD', use_case: 1 }),
      makeDelegation({ to_address: '0xDDD', use_case: 2 }),
    ]
    const pairs = buildPairs(out, [])
    expect(pairs).toHaveLength(2)
    expect(pairs.find(p => p.useCase === 1)).toBeTruthy()
    expect(pairs.find(p => p.useCase === 2)).toBeTruthy()
  })

  it('handles multiple addresses with mixed directions', () => {
    const out = [
      makeDelegation({ to_address: '0xAAA', use_case: 999 }),
      makeDelegation({ to_address: '0xBBB', use_case: 999 }),
    ]
    const inc = [makeDelegation({ from_address: '0xBBB', use_case: 999 })]
    const pairs = buildPairs(out, inc)
    expect(pairs).toHaveLength(2)

    const aaa = pairs.find(p => p.address === '0xAAA')!
    expect(aaa.outgoing).toBe(true)
    expect(aaa.incoming).toBe(false)

    const bbb = pairs.find(p => p.address === '0xBBB')!
    expect(bbb.outgoing).toBe(true)
    expect(bbb.incoming).toBe(true)
  })
})
