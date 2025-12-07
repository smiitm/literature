import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Force dark mode globally since light mode is no longer supported.
document.documentElement.classList.add('dark')
document.documentElement.classList.remove('light')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
