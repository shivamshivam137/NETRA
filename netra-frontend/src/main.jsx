import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { SidebarProvider } from './context/SidebarContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <SidebarProvider>
          <App />
        </SidebarProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
