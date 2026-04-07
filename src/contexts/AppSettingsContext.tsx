import { createContext, useContext, useState, type ReactNode } from 'react'
import { defaultModelId, defaultOptimizeModelId } from '../data/reviewConfig'
import { hasStoredApiKey, setStoredApiKey } from '../lib/openrouter'

interface AppSettings {
  reviewModel: string
  optimizeModel: string
  setReviewModel: (model: string) => void
  setOptimizeModel: (model: string) => void
  hasApiKey: boolean
  saveApiKey: (key: string) => void
}

const AppSettingsContext = createContext<AppSettings | null>(null)

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [reviewModel, setReviewModel] = useState(defaultModelId)
  const [optimizeModel, setOptimizeModel] = useState(defaultOptimizeModelId)
  const [hasKey, setHasKey] = useState(hasStoredApiKey)

  const saveApiKey = (key: string) => {
    setStoredApiKey(key)
    setHasKey(true)
  }

  return (
    <AppSettingsContext.Provider
      value={{
        reviewModel,
        optimizeModel,
        setReviewModel,
        setOptimizeModel,
        hasApiKey: hasKey,
        saveApiKey,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  )
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext)
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider')
  }
  return context
}
