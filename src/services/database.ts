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

export async function getWebsites(): Promise<Website[]> {
  const database = await initDatabase()
  const websites = await database.select<Website[]>(
    'SELECT id, name, url, icon, rss_url, created_at, last_checked FROM websites ORDER BY created_at DESC'
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
