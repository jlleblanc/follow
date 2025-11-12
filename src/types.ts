export interface Website {
  id?: number
  name: string
  url: string
  icon?: string
  rss_url?: string
  created_at: string
  last_checked?: string
  unreadCount?: number
}

export interface FeedItem {
  id?: number
  website_id: number
  title: string
  link: string
  description?: string
  published_at?: string
  is_read: boolean
  created_at: string
}
