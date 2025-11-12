import { useState, useEffect } from 'react'
import { Bell, X, AlertCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export type Notification = {
  id: string
  type: 'update' | 'error'
  message: string
  timestamp: Date
}

export function NotificationBar() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expanded, setExpanded] = useState(false)

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.length

  if (unreadCount === 0) return null

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="font-medium">
            {unreadCount} {unreadCount === 1 ? 'notification' : 'notifications'}
          </span>
        </button>
        <button
          onClick={() => setNotifications([])}
          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Clear all
        </button>
      </div>
      
      {expanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={cn(
                "px-4 py-3 flex items-start gap-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0",
                notification.type === 'error' && "bg-red-50 dark:bg-red-900/20"
              )}
            >
              {notification.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
