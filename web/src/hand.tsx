import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { HandPage } from './ui/pages/HandPage'
import { useThemeStore } from './store/themeStore'

useThemeStore.getState().loadSavedTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HandPage />
  </StrictMode>,
)
