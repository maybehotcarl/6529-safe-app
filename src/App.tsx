import { useState } from 'react'
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

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
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
