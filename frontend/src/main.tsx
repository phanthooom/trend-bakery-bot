import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Remove PII that was persisted in earlier versions
try {
  const raw = localStorage.getItem('trend-bakery-storage')
  if (raw) {
    const parsed = JSON.parse(raw)
    if (parsed?.state?.savedAddresses !== undefined || parsed?.state?.phone !== undefined) {
      delete parsed.state.savedAddresses
      delete parsed.state.phone
      delete parsed.state.address
      localStorage.setItem('trend-bakery-storage', JSON.stringify(parsed))
    }
  }
} catch {}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
