import { Interface } from 'ethers'
import { NFT_DELEGATION_ABI, ERC721_ABI, ERC1155_ABI } from './abis.ts'
import { CONTRACTS } from './addresses.ts'

const delegationIface = new Interface(NFT_DELEGATION_ABI)
const erc721Iface = new Interface(ERC721_ABI)
const erc1155Iface = new Interface(ERC1155_ABI)

export interface SafeTx {
  to: string
  value: string
  data: string
}

export function encodeRegisterDelegation(
  collectionAddress: string,
  delegationAddress: string,
  expiryDate: bigint,
  useCase: number,
  allTokens: boolean,
  tokenId: bigint,
): SafeTx {
  return {
    to: CONTRACTS.NFT_DELEGATION,
    value: '0',
    data: delegationIface.encodeFunctionData('registerDelegationAddress', [
      collectionAddress,
      delegationAddress,
      expiryDate,
      useCase,
      allTokens,
      tokenId,
    ]),
  }
}

export function encodeRevokeDelegation(
  collectionAddress: string,
  delegationAddress: string,
  useCase: number,
): SafeTx {
  return {
    to: CONTRACTS.NFT_DELEGATION,
    value: '0',
    data: delegationIface.encodeFunctionData('revokeDelegationAddress', [
      collectionAddress,
      delegationAddress,
      useCase,
    ]),
  }
}

export function encodeERC721Transfer(
  contract: string,
  from: string,
  to: string,
  tokenId: bigint,
): SafeTx {
  return {
    to: contract,
    value: '0',
    data: erc721Iface.encodeFunctionData('safeTransferFrom', [from, to, tokenId]),
  }
}

export function encodeERC1155Transfer(
  contract: string,
  from: string,
  to: string,
  tokenId: bigint,
  amount: bigint,
): SafeTx {
  return {
    to: contract,
    value: '0',
    data: erc1155Iface.encodeFunctionData('safeTransferFrom', [from, to, tokenId, amount, '0x']),
  }
}
