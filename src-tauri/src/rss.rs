use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FeedMetadata {
    pub title: String,
    pub description: Option<String>,
    pub link: String,
    pub feed_url: String,
    pub icon: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedEntry {
    pub title: String,
    pub link: String,
    pub description: Option<String>,
    pub published: Option<String>,
}

/// Discover RSS feed URL from a website
pub async fn discover_feed(url: &str) -> Result<String, String> {
    // Try common RSS feed paths
    let feed_paths = vec![
        "/feed",
        "/rss",
        "/feed.xml",
        "/rss.xml",
        "/atom.xml",
        "/index.xml",
    ];
    
    // First, try to fetch the main page and look for feed links
    let client = reqwest::Client::builder()
        .user_agent("Follow/0.1.0")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client.get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch website: {}", e))?;
    
    let html = response.text().await.map_err(|e| e.to_string())?;
    
    // Look for RSS/Atom feed links in HTML
    if let Some(feed_url) = extract_feed_url_from_html(&html, url) {
        return Ok(feed_url);
    }
    
    // Try common feed paths
    let base_url = url.trim_end_matches('/');
    for path in feed_paths {
        let feed_url = format!("{}{}", base_url, path);
        if let Ok(_) = fetch_feed(&feed_url).await {
            return Ok(feed_url);
        }
    }
    
    Err("No RSS feed found".to_string())
}

/// Extract feed URL from HTML
pub fn extract_feed_url_from_html(html: &str, base_url: &str) -> Option<String> {
    // Simple regex-based extraction (in production, use a proper HTML parser)
    let patterns = vec![
        r#"<link[^>]+type=["']application/rss\+xml["'][^>]+href=["']([^"']+)["']"#,
        r#"<link[^>]+href=["']([^"']+)["'][^>]+type=["']application/rss\+xml["']"#,
        r#"<link[^>]+type=["']application/atom\+xml["'][^>]+href=["']([^"']+)["']"#,
        r#"<link[^>]+href=["']([^"']+)["'][^>]+type=["']application/atom\+xml["']"#,
    ];
    
    for pattern in patterns {
        if let Ok(re) = regex::Regex::new(pattern) {
            if let Some(captures) = re.captures(html) {
                if let Some(feed_path) = captures.get(1) {
                    let feed_url = feed_path.as_str();
                    // Handle relative URLs
                    if feed_url.starts_with("http") {
                        return Some(feed_url.to_string());
                    } else if feed_url.starts_with('/') {
                        let base = base_url.trim_end_matches('/');
                        return Some(format!("{}{}", base, feed_url));
                    } else {
                        let base = base_url.trim_end_matches('/');
                        return Some(format!("{}/{}", base, feed_url));
                    }
                }
            }
        }
    }
    
    None
}

/// Fetch and parse RSS feed
pub async fn fetch_feed(feed_url: &str) -> Result<(FeedMetadata, Vec<FeedEntry>), String> {
    let client = reqwest::Client::builder()
        .user_agent("Follow/0.1.0")
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;
    
    let response = client.get(feed_url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch feed: {}", e))?;
    
    let content = response.bytes().await.map_err(|e| e.to_string())?;
    
    let feed = feed_rs::parser::parse(&content[..])
        .map_err(|e| format!("Failed to parse feed: {}", e))?;
    
    let metadata = FeedMetadata {
        title: feed.title.map(|t| t.content).unwrap_or_else(|| "Untitled Feed".to_string()),
        description: feed.description.map(|d| d.content),
        link: feed.links.first().map(|l| l.href.clone()).unwrap_or_default(),
        feed_url: feed_url.to_string(),
        icon: feed.icon.map(|i| i.uri),
    };
    
    let entries: Vec<FeedEntry> = feed.entries.iter().take(20).map(|entry| {
        FeedEntry {
            title: entry.title.as_ref().map(|t| t.content.clone()).unwrap_or_else(|| "Untitled".to_string()),
            link: entry.links.first().map(|l| l.href.clone()).unwrap_or_default(),
            description: entry.summary.as_ref().map(|s| s.content.clone()),
            published: entry.published.map(|p| p.to_rfc3339()),
        }
    }).collect();
    
    Ok((metadata, entries))
}

/// Fetch favicon from website
pub async fn fetch_favicon(url: &str) -> Option<String> {
    let client = reqwest::Client::builder()
        .user_agent("Follow/0.1.0")
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .ok()?;
    
    // Try common favicon paths
    let favicon_paths = vec![
        "/favicon.ico",
        "/favicon.png",
        "/apple-touch-icon.png",
    ];
    
    let base_url = url.trim_end_matches('/');
    
    for path in favicon_paths {
        let favicon_url = format!("{}{}", base_url, path);
        if let Ok(response) = client.head(&favicon_url).send().await {
            if response.status().is_success() {
                return Some(favicon_url);
            }
        }
    }
    
    None
}
