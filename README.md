# 6529 Safe App

A [Safe Apps SDK](https://docs.safe.global/sdk/overview) frontend for managing NFT delegations, wallet consolidation, and NFT transfers within the [6529 ecosystem](https://6529.io).

Designed to run inside the Safe{Wallet} UI as a custom app.

## Features

- **Wallet Consolidation** — Link your Safe to a hot wallet so 6529 sees them as one identity (use cases 998/999). Shows real-time status of both sides and warns about incoming requests from unknown wallets.
- **Delegation Management** — Register and revoke delegations across all 6529 use cases (minting, airdrops, voting, etc.) for specific collections or all collections.
- **NFT Viewing** — Browse NFTs held by the Safe across The Memes, 6529 Gradient, and NextGen (Pebbles).
- **Batch Transfers** — Select and transfer multiple NFTs (ERC-721 and ERC-1155) in a single Safe transaction.

## Security

- EIP-55 checksum validation on all address inputs
- Zero address and self-address blocking
- Confirmation dialogs with full address display on all irreversible actions
- Social engineering warnings on incoming consolidation requests
- Chain ID verification (Ethereum Mainnet only)
- Batch transfer cap (20 NFTs) to prevent gas issues
- 1-year expiry on consolidations by default
- Clear messaging that proposed transactions still need Safe signer approval

## Setup

```bash
npm install
npm run dev
```

## Adding to Safe

1. Deploy or run locally (`npm run dev` → `http://localhost:5173`)
2. In Safe{Wallet}, go to Apps → My custom apps → Add custom app
3. Enter the app URL

Production deployment: https://6529-safe-app.vercel.app

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- ethers.js 6
- Safe Apps SDK / React SDK

## Contracts

| Contract | Address |
|----------|---------|
| NFT Delegation | `0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d` |
| The Memes | `0x33FD426905F149f8376e227d0C9D3340AaD17aF1` |
| 6529 Gradient | `0x0C58Ef43fF3032005e472cB5709f8908aCb00205` |
| NextGen (Pebbles) | `0x45882f9bc325E14FBb298a1Df930C43a874B83ae` |

## API

All delegation and NFT data is fetched from `https://api.6529.io`.

## Project Structure

```
src/
├── api/            # API calls to 6529 + response types
├── components/
│   ├── delegations/  # ConsolidationCard, DelegationsTab, RegisterForm
│   ├── nfts/         # NftCard, NftsTab
│   └── transfer/     # TransferTab
├── contracts/      # ABIs, addresses, tx encoders
├── hooks/          # useDelegations, useConsolidationStatus, useOwnedNfts, useProposeTx
└── lib/            # Constants, address validation
```
