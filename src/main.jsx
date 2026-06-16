import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ERPProvider } from './context/ERPContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ERPProvider>
      <App />
    </ERPProvider>
  </StrictMode>,
)
