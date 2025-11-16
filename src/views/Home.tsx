import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Plus, ExternalLink, Trash2 } from 'lucide-react'
import { View } from '../App'
import { Website } from '../types'
import { getWebsites, removeWebsite as deleteWebsite } from '../services/database'

interface HomeProps {
  onNavigate: (view: View) => void
  refreshTrigger?: number
  onOpenWebsiteDetail?: (id: number) => void
}

export function Home({ onNavigate, refreshTrigger, onOpenWebsiteDetail }: HomeProps) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)

  const loadWebsites = async () => {
    try {
      setLoading(true)
      const result = await getWebsites()
      setWebsites(result)
    } catch (error) {
      console.error('Failed to load websites:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWebsites()
  }, [refreshTrigger])

  const removeWebsite = async (id: number) => {
    try {
      await deleteWebsite(id)
      setWebsites(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to remove website:', error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Follow</h1>
        <button
          onClick={() => onNavigate('settings')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {websites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No websites yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘K</kbd> or{' '}
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">Ctrl+K</kbd> to add your first website
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {websites.map(website => (
              <div
                key={website.id}
                className="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => {
                  if (website.id && onOpenWebsiteDetail) {
                    onOpenWebsiteDetail(website.id)
                  }
                }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  {website.icon ? (
                    <img src={website.icon} alt={website.name} className="w-8 h-8" />
                  ) : (
                    <ExternalLink className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Name */}
                <h3 className="font-semibold mb-1 truncate">{website.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{website.url}</p>

                {/* Unread badge */}
                {website.unreadCount && website.unreadCount > 0 && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {website.unreadCount}
                  </div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (website.id) removeWebsite(website.id)
                  }}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-all"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
