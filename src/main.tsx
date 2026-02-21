import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SafeProvider from '@safe-global/safe-apps-react-sdk'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SafeProvider>
        <App />
      </SafeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
