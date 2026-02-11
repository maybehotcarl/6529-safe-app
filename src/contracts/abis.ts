export const NFT_DELEGATION_ABI = [
  'function registerDelegationAddress(address _collectionAddress, address _delegationAddress, uint256 _expiryDate, uint256 _useCase, bool _allTokens, uint256 _tokenId)',
  'function revokeDelegationAddress(address _collectionAddress, address _delegationAddress, uint256 _useCase)',
  'function registerDelegationAddressUsingSubDelegation(address _delegatorAddress, address _collectionAddress, address _delegationAddress, uint256 _expiryDate, uint256 _useCase, bool _allTokens, uint256 _tokenId)',
  'function batchDelegations(address[] _collectionAddresses, address[] _delegationAddresses, uint256[] _expiryDates, uint256[] _useCases, bool[] _allTokens, uint256[] _tokenIds)',
  'function retrieveDelegationAddresses(address _delegatorAddress, address _collectionAddress, uint256 _useCase) view returns (address[])',
] as const

export const ERC721_ABI = [
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
] as const

export const ERC1155_ABI = [
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',
  'function balanceOf(address account, uint256 id) view returns (uint256)',
] as const
