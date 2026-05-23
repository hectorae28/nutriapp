import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import NutriApp from './NutriApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NutriApp />
  </StrictMode>,
)
