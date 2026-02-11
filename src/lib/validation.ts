import { getAddress } from 'ethers'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * Validates an Ethereum address with EIP-55 checksum verification.
 * Returns the checksummed address on success, or an error string on failure.
 */
export function validateAddress(
  raw: string,
  safeAddress?: string,
): { valid: true; address: string } | { valid: false; error: string } {
  const trimmed = raw.trim()

  if (!trimmed.match(/^0x[0-9a-fA-F]{40}$/)) {
    return { valid: false, error: 'Invalid Ethereum address format' }
  }

  let checksummed: string
  try {
    checksummed = getAddress(trimmed)
  } catch {
    return { valid: false, error: 'Invalid address checksum. Please verify the address.' }
  }

  if (checksummed === ZERO_ADDRESS) {
    return { valid: false, error: 'Cannot use the zero address' }
  }

  if (safeAddress && checksummed.toLowerCase() === safeAddress.toLowerCase()) {
    return { valid: false, error: 'Cannot use your own Safe address' }
  }

  return { valid: true, address: checksummed }
}
