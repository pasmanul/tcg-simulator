import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BoardPage } from './ui/pages/BoardPage'
import { useSkinStore } from './store/skinStore'
import { SkinProvider } from './ui/skin/SkinContext'

useSkinStore.getState().loadSavedSkin()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SkinProvider>
      <BoardPage />
    </SkinProvider>
  </StrictMode>,
)
