import { createContext, useContext, useState, useEffect } from 'react'

const SidebarContext = createContext()

const STORAGE_KEY = 'netra_sidebar_collapsed'

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved !== null ? JSON.parse(saved) : false
    } catch (err) {
      console.warn('Failed to read sidebar state from localStorage', err)
      return false
    }
  })

  // Smoothly dispatch resize events to update Leaflet maps and chart components
  const triggerResizeUpdates = () => {
    // Repeated ticks during 300ms animation so map fluidly resizes
    const interval = setInterval(() => {
      window.dispatchEvent(new Event('resize'))
    }, 50)
    setTimeout(() => {
      clearInterval(interval)
      window.dispatchEvent(new Event('resize'))
    }, 350)
  }

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (err) {
        console.warn('Failed to write sidebar state to localStorage', err)
      }
      triggerResizeUpdates()
      return next
    })
  }

  const setCollapsed = (val) => {
    setIsCollapsed(val)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch (err) {
      console.warn('Failed to write sidebar state to localStorage', err)
    }
    triggerResizeUpdates()
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
