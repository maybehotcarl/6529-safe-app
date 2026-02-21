import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isDelegation, fetchAllPages } from './seize.ts'

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

describe('fetchAllPages', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  const mockFetch = () => globalThis.fetch as ReturnType<typeof vi.fn>
  const identity = (items: unknown[]) => items as string[]

  function jsonResponse(body: unknown, ok = true) {
    return Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    } as Response)
  }

  it('fetches a single page of results', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ data: ['a', 'b'], next: null }))

    const result = await fetchAllPages('https://api.test/items?foo=1', identity)

    expect(result).toEqual(['a', 'b'])
    expect(mockFetch()).toHaveBeenCalledTimes(1)
    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/items?foo=1&page_size=200&page=1')
  })

  it('paginates across multiple pages', async () => {
    const page1 = Array.from({ length: 2 }, (_, i) => `item${i}`)
    const page2 = ['last']

    mockFetch()
      .mockReturnValueOnce(jsonResponse({ data: page1, next: 'yes' }))
      .mockReturnValueOnce(jsonResponse({ data: page2, next: null }))

    const result = await fetchAllPages('https://api.test/items', identity, { pageSize: 2 })

    expect(result).toEqual(['item0', 'item1', 'last'])
    expect(mockFetch()).toHaveBeenCalledTimes(2)
    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/items?page_size=2&page=1')
    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/items?page_size=2&page=2')
  })

  it('stops when page count reaches maxPages', async () => {
    const fullPage = ['a', 'b']
    mockFetch()
      .mockReturnValueOnce(jsonResponse({ data: fullPage, next: 'yes' }))
      .mockReturnValueOnce(jsonResponse({ data: fullPage, next: 'yes' }))
      .mockReturnValueOnce(jsonResponse({ data: fullPage, next: 'yes' }))

    const result = await fetchAllPages('https://api.test/x', identity, { pageSize: 2, maxPages: 2 })

    expect(result).toEqual(['a', 'b', 'a', 'b'])
    expect(mockFetch()).toHaveBeenCalledTimes(2)
  })

  it('stops when items.length < pageSize (partial page)', async () => {
    mockFetch()
      .mockReturnValueOnce(jsonResponse({ data: ['a', 'b', 'c'], next: 'yes' }))
      .mockReturnValueOnce(jsonResponse({ data: ['d'], next: 'yes' }))

    const result = await fetchAllPages('https://api.test/x', identity, { pageSize: 3 })

    expect(result).toEqual(['a', 'b', 'c', 'd'])
    expect(mockFetch()).toHaveBeenCalledTimes(2)
  })

  it('returns collected items so far on non-ok response', async () => {
    mockFetch()
      .mockReturnValueOnce(jsonResponse({ data: ['a'], next: 'yes' }))
      .mockReturnValueOnce(jsonResponse(null, false))

    const result = await fetchAllPages('https://api.test/x', identity, { pageSize: 1 })

    expect(result).toEqual(['a'])
  })

  it('returns collected items on malformed JSON (non-object)', async () => {
    mockFetch()
      .mockReturnValueOnce(jsonResponse({ data: ['a'], next: 'yes' }))
      .mockReturnValueOnce(Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error('bad json')),
      } as Response))

    const result = await fetchAllPages('https://api.test/x', identity, { pageSize: 1 })

    expect(result).toEqual(['a'])
  })

  it('returns empty array when first page has no data array', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ items: ['a'] }))

    const result = await fetchAllPages('https://api.test/x', identity)

    expect(result).toEqual([])
  })

  it('returns empty array when response is not an object', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse('not json'))

    const result = await fetchAllPages('https://api.test/x', identity)

    expect(result).toEqual([])
  })

  it('applies transform function to items', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ data: [1, 2, 3], next: null }))

    const result = await fetchAllPages<number>(
      'https://api.test/x',
      (items) => (items as number[]).map(n => n * 10),
    )

    expect(result).toEqual([10, 20, 30])
  })

  it('uses & separator when baseUrl contains ?', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ data: [], next: null }))

    await fetchAllPages('https://api.test/x?filter=true', identity)

    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/x?filter=true&page_size=200&page=1')
  })

  it('uses ? separator when baseUrl has no query string', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ data: [], next: null }))

    await fetchAllPages('https://api.test/x', identity)

    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/x?page_size=200&page=1')
  })

  it('respects custom separator option', async () => {
    mockFetch().mockReturnValueOnce(jsonResponse({ data: [], next: null }))

    await fetchAllPages('https://api.test/x', identity, { separator: ';' })

    expect(mockFetch()).toHaveBeenCalledWith('https://api.test/x;page_size=200&page=1')
  })
})
