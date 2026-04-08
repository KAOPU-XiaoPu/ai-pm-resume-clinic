import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AppSettingsProvider } from './contexts/AppSettingsContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AppSettingsProvider>
        <App />
        <Toaster position="top-center" richColors />
      </AppSettingsProvider>
    </HashRouter>
  </StrictMode>,
)
