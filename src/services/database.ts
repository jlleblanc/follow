import Database from '@tauri-apps/plugin-sql'
import { invoke } from '@tauri-apps/api/core'
import { Website, FeedItem } from '../types'

let db: Database | null = null

export async function initDatabase() {
  if (!db) {
    db = await Database.load('sqlite:follow.db')
  }
  return db
}

interface WebsiteMetadata {
  title: string
  url: string
  feed_url: string
  icon?: string
  description?: string
}

export async function addWebsite(url: string): Promise<Website> {
  const database = await initDatabase()
  
  // Discover website metadata and RSS feed
  const metadata = await invoke<WebsiteMetadata>('discover_website', { url })
  
  const created_at = new Date().toISOString()
  
  const result = await database.execute(
    'INSERT INTO websites (name, url, icon, rss_url, created_at) VALUES (?, ?, ?, ?, ?)',
    [metadata.title, metadata.url, metadata.icon || null, metadata.feed_url, created_at]
  )
  
  return {
    id: result.lastInsertId,
    name: metadata.title,
    url: metadata.url,
    icon: metadata.icon,
    rss_url: metadata.feed_url,
    created_at,
  }
}

// Type returned from the Rust fetch_feed_entries command
interface RssFeedEntry {
  title: string
  link: string
  description?: string
  published?: string
}

export async function getWebsites(): Promise<Website[]> {
  const database = await initDatabase()
  const websites = await database.select<Website[]>(
    `SELECT
       w.id,
       w.name,
       w.url,
       w.icon,
       w.rss_url,
       w.created_at,
       w.last_checked,
       (
         SELECT COUNT(*)
         FROM feed_items fi
         WHERE fi.website_id = w.id AND fi.is_read = 0
       ) AS unreadCount
     FROM websites w
     ORDER BY w.created_at DESC`
  )
  return websites
}

export async function removeWebsite(id: number): Promise<void> {
  const database = await initDatabase()
  await database.execute('DELETE FROM websites WHERE id = ?', [id])
}

export async function getFeedItems(websiteId: number): Promise<FeedItem[]> {
  const database = await initDatabase()
  const items = await database.select<FeedItem[]>(
    'SELECT id, website_id, title, link, description, published_at, is_read, created_at FROM feed_items WHERE website_id = ? ORDER BY published_at DESC',
    [websiteId]
  )
  return items
}

export async function markFeedItemsRead(websiteId: number): Promise<void> {
  const database = await initDatabase()
  await database.execute('UPDATE feed_items SET is_read = 1 WHERE website_id = ?', [websiteId])
}

// Refresh a single website's feed and return the number of new items added
export async function refreshFeedForWebsite(websiteId: number): Promise<number> {
  const database = await initDatabase()

  let newItems = 0
  const now = new Date().toISOString()

  const sites = await database.select<Website[]>(
    'SELECT id, name, url, icon, rss_url, created_at, last_checked FROM websites WHERE id = ? AND rss_url IS NOT NULL',
    [websiteId],
  )

  for (const site of sites) {
    if (!site.id || !site.rss_url) continue

    let entries: RssFeedEntry[] = []
    try {
      // Tauri maps Rust `feed_url` parameter to JS key `feedUrl`
      entries = await invoke<RssFeedEntry[]>('fetch_feed_entries', { feedUrl: site.rss_url })
    } catch (e) {
      console.error('Failed to fetch feed entries for site', site.url, e)
      continue
    }

    for (const entry of entries) {
      try {
        const result: any = await database.execute(
          'INSERT OR IGNORE INTO feed_items (website_id, title, link, description, published_at, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
          [
            site.id,
            entry.title,
            entry.link,
            entry.description ?? null,
            entry.published ?? null,
            now,
          ],
        )

        if (result && typeof result.rowsAffected === 'number' && result.rowsAffected > 0) {
          newItems += result.rowsAffected
        }
      } catch (e) {
        console.error('Failed to insert feed item for site', site.url, e)
      }
    }

    // Update last_checked for the site
    try {
      await database.execute('UPDATE websites SET last_checked = ? WHERE id = ?', [now, site.id])
    } catch (e) {
      console.error('Failed to update last_checked for site', site.url, e)
    }
  }

  return newItems
}

// Refresh all feeds once and return the number of new items added
export async function refreshAllFeedsOnce(): Promise<number> {
  const database = await initDatabase()

  const websites = await database.select<Website[]>(
    'SELECT id, name, url, icon, rss_url, created_at, last_checked FROM websites WHERE rss_url IS NOT NULL'
  )

  let totalNewItems = 0
  for (const site of websites) {
    if (!site.id) continue
    totalNewItems += await refreshFeedForWebsite(site.id)
  }

  return totalNewItems
}
