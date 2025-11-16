import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { View } from '../App'
import { FeedItem, Website } from '../types'
import { getFeedItems, getWebsites, markFeedItemsRead, refreshFeedForWebsite } from '../services/database'

interface WebsiteDetailProps {
  websiteId: number
  onNavigate: (view: View) => void
  onBackToHome?: () => void
}

export function WebsiteDetail({ websiteId, onNavigate, onBackToHome }: WebsiteDetailProps) {
  const [website, setWebsite] = useState<Website | null>(null)
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Refresh this website's feed so we show the latest contents
        await refreshFeedForWebsite(websiteId)

        const [sites, feedItems] = await Promise.all([
          getWebsites(),
          getFeedItems(websiteId),
        ])
        const site = sites.find((s) => s.id === websiteId) || null
        setWebsite(site)
        setItems(feedItems)
        await markFeedItemsRead(websiteId)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [websiteId])

  const handleBack = () => {
    onBackToHome?.()
    onNavigate('home')
  }

  const openItem = (link: string) => {
    window.open(link, '_blank')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">
            {website?.name ?? 'Website'}
          </h1>
          {website?.url && (
            <button
              onClick={() => openItem(website.url)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              {website.url}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading feed…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No items found for this feed yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <button
                key={item.id ?? item.link}
                onClick={() => openItem(item.link)}
                className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold mb-1 line-clamp-2">{item.title}</h2>
                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3" dangerouslySetInnerHTML={{ __html: item.description }} />
                    )}
                  </div>
                  {item.published_at && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(item.published_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
