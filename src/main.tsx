import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { installSoundEngine } from './audio/soundEngine'
import './styles/global.css'

installSoundEngine()

const rootElement = document.getElementById('root')

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
