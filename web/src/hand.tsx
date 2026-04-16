import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { HandPage } from './ui/pages/HandPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HandPage />
  </StrictMode>,
)
