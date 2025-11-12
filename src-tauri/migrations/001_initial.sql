-- Create websites table
CREATE TABLE IF NOT EXISTS websites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    icon TEXT,
    rss_url TEXT,
    created_at TEXT NOT NULL,
    last_checked TEXT
);

-- Create feed_items table
CREATE TABLE IF NOT EXISTS feed_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    description TEXT,
    published_at TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_feed_items_website_id ON feed_items(website_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_is_read ON feed_items(is_read);
CREATE INDEX IF NOT EXISTS idx_websites_url ON websites(url);
