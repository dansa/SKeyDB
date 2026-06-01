import {StrictMode} from 'react'

import {createRoot} from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'

import './index.css'

import App from './App.tsx'
import {getRouterBasename, replaceLegacyHashRoute} from './legacy-hash-routing'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root was not found')
}

replaceLegacyHashRoute(import.meta.env.BASE_URL)

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter basename={getRouterBasename(import.meta.env.BASE_URL)}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
