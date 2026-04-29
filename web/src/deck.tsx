import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DeckPage } from './ui/pages/DeckPage'
import { useSkinStore } from './store/skinStore'
import { SkinProvider } from './ui/skin/SkinContext'

useSkinStore.getState().loadSavedSkin()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkinProvider>
      <DeckPage />
    </SkinProvider>
  </StrictMode>,
)
