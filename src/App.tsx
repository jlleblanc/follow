import { useState, useEffect } from 'react'
import { Home } from './views/Home'
import { Settings } from './views/Settings'
import { WebsiteDetail } from './views/WebsiteDetail'
import { CommandBar } from './components/CommandBar'
import { NotificationBar } from './components/NotificationBar'
import { refreshAllFeedsOnce } from './services/database'
import { sendNotification as sendInAppNotification } from './notifications'
import {
  isPermissionGranted,
  requestPermission,
  sendNotification as sendSystemNotification,
} from '@tauri-apps/plugin-notification'

export type View = 'home' | 'settings' | 'detail'

function App() {
  const [currentView, setCurrentView] = useState<View>('home')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<number | null>(null)

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

  // Periodic feed refresh scheduler (runs while app is open)
  useEffect(() => {
    let isCancelled = false
    let intervalId: number | undefined

    const init = async () => {
      // Prepare notification permission once
      let granted = await isPermissionGranted()
      if (!granted) {
        const perm = await requestPermission()
        granted = perm === 'granted'
      }

      const runOnce = async () => {
        if (isCancelled) return
        try {
          const newCount = await refreshAllFeedsOnce()
          if (newCount > 0) {
            const msg =
              newCount === 1
                ? '1 new item across your feeds'
                : `${newCount} new items across your feeds`

            // In-app notification bar
            sendInAppNotification({ type: 'update', message: msg })

            // System notification
            if (granted) {
              await sendSystemNotification({ title: 'Follow', body: msg })
            }
          }
        } catch (e) {
          console.error('Failed to refresh feeds', e)
          sendInAppNotification({
            type: 'error',
            message: 'Failed to refresh feeds. See console for details.',
          })
        }
      }

      // Initial run
      await runOnce()

      // Read interval from localStorage (minutes), default 60
      const stored = Number(localStorage.getItem('updateIntervalMinutes') ?? '60')
      const minutes = Number.isFinite(stored) && stored > 0 ? stored : 60
      const ms = minutes * 60 * 1000

      intervalId = window.setInterval(runOnce, ms)
    }

    init()

    return () => {
      isCancelled = true
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <div className="h-screen flex flex-col">
      <NotificationBar />
      
      <div className="flex-1 overflow-hidden">
        {currentView === 'home' && (
          <Home
            onNavigate={setCurrentView}
            refreshTrigger={refreshTrigger}
            onOpenWebsiteDetail={(id) => {
              setSelectedWebsiteId(id)
              setCurrentView('detail')
            }}
          />
        )}
        {currentView === 'settings' && (
          <Settings 
            onNavigate={setCurrentView} 
            theme={theme}
            onThemeChange={toggleTheme}
          />
        )}
        {currentView === 'detail' && selectedWebsiteId != null && (
          <WebsiteDetail
            websiteId={selectedWebsiteId}
            onNavigate={setCurrentView}
            onBackToHome={() => setRefreshTrigger(prev => prev + 1)}
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
