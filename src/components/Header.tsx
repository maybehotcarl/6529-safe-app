import { useSafeAppsSDK } from '@safe-global/safe-apps-react-sdk'
import { shortenAddress } from '../lib/constants.ts'

export default function Header() {
  const { safe } = useSafeAppsSDK()

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="6529" className="w-8 h-8" />
        <h1 className="text-lg font-bold tracking-tight">6529 Tools</h1>
      </div>
      <div className="text-sm text-gray-400 font-mono">
        {safe.safeAddress ? shortenAddress(safe.safeAddress) : 'Not connected'}
      </div>
    </header>
  )
}
