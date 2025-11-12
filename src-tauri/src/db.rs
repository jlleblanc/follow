use tauri::AppHandle;
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create initial tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        }
    ]
}

pub async fn init_db(app: &AppHandle) -> Result<(), String> {
    // The database will be initialized automatically by the SQL plugin
    // with the migrations we provide in the plugin builder
    Ok(())
}
