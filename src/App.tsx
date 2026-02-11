import { useState } from 'react'
import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import Header from './components/Header.tsx'
import DelegationsTab from './components/delegations/DelegationsTab.tsx'
import NftsTab from './components/nfts/NftsTab.tsx'
import TransferTab from './components/transfer/TransferTab.tsx'

type Tab = 'delegations' | 'nfts' | 'transfer'

const TABS: { id: Tab; label: string }[] = [
  { id: 'delegations', label: 'Delegations' },
  { id: 'nfts', label: 'NFTs' },
  { id: 'transfer', label: 'Transfer' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('delegations')
  const { safe } = useSafeAppsSDK()
  const wrongNetwork = safe.chainId !== 1

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      {wrongNetwork && (
        <div className="bg-red-900/60 border-b border-red-700 px-4 py-2 text-center text-sm text-red-200">
          Warning: This app is designed for Ethereum Mainnet (chain 1). Your Safe is on chain {safe.chainId}. Transactions may fail or target wrong contracts.
        </div>
      )}
      <nav className="flex border-b border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-accent'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="max-w-6xl mx-auto p-4">
        {activeTab === 'delegations' && <DelegationsTab />}
        {activeTab === 'nfts' && <NftsTab />}
        {activeTab === 'transfer' && <TransferTab />}
      </main>
    </div>
  )
}
