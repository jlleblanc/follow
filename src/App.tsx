import { useState, useEffect } from 'react'
import { Home } from './views/Home'
import { Settings } from './views/Settings'
import { CommandBar } from './components/CommandBar'
import { NotificationBar } from './components/NotificationBar'

export type View = 'home' | 'settings'

function App() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Initialize theme from system preference
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Global keyboard shortcut for Command/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandBarOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="h-screen flex flex-col">
      <NotificationBar />
      
      <div className="flex-1 overflow-hidden">
        {currentView === 'home' && (
          <Home onNavigate={setCurrentView} refreshTrigger={refreshTrigger} />
        )}
        {currentView === 'settings' && (
          <Settings 
            onNavigate={setCurrentView} 
            theme={theme}
            onThemeChange={toggleTheme}
          />
        )}
      </div>

      <CommandBar 
        open={commandBarOpen} 
        onOpenChange={setCommandBarOpen}
        onWebsiteAdded={() => setRefreshTrigger(prev => prev + 1)}
      />
    </div>
  )
}

export default App
