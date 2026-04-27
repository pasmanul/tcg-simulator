import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BoardPage } from './ui/pages/BoardPage'
import { useThemeStore } from './store/themeStore'

// 保存済みテーマをCSS変数に適用してからレンダリング
useThemeStore.getState().loadSavedTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BoardPage />
  </StrictMode>,
)
