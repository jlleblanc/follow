use tauri_plugin_sql::Builder as SqlBuilder;
use serde::{Deserialize, Serialize};

mod db;
mod rss;

#[derive(Debug, Serialize, Deserialize)]
pub struct WebsiteMetadata {
    pub title: String,
    pub url: String,
    pub feed_url: String,
    pub icon: Option<String>,
    pub description: Option<String>,
}

#[tauri::command]
async fn discover_website(url: String) -> Result<WebsiteMetadata, String> {
    println!("Discovering website: {}", url);
    
    // Discover RSS feed
    let feed_url = match rss::discover_feed(&url).await {
        Ok(url) => {
            println!("Found RSS feed: {}", url);
            url
        }
        Err(e) => {
            println!("Failed to discover feed: {}", e);
            return Err(e);
        }
    };
    
    // Fetch feed metadata
    let (metadata, _entries) = match rss::fetch_feed(&feed_url).await {
        Ok(data) => {
            println!("Fetched feed metadata: {}", data.0.title);
            data
        }
        Err(e) => {
            println!("Failed to fetch feed: {}", e);
            return Err(e);
        }
    };
    
    // Try to get favicon
    let icon = rss::fetch_favicon(&url).await;
    if let Some(ref icon_url) = icon {
        println!("Found favicon: {}", icon_url);
    }
    
    Ok(WebsiteMetadata {
        title: metadata.title,
        url,
        feed_url,
        icon,
        description: metadata.description,
    })
}

#[tauri::command]
async fn fetch_feed_entries(feed_url: String) -> Result<Vec<rss::FeedEntry>, String> {
    println!("Fetching feed entries for: {}", feed_url);

    match rss::fetch_feed(&feed_url).await {
        Ok((_meta, entries)) => Ok(entries),
        Err(e) => {
            println!("Failed to fetch feed entries: {}", e);
            Err(e)
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = db::get_migrations();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            SqlBuilder::default()
                .add_migrations("sqlite:follow.db", migrations)
                .build()
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![discover_website, fetch_feed_entries])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
