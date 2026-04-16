import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BoardPage } from './ui/pages/BoardPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BoardPage />
  </StrictMode>,
)
