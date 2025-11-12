# Follow

Follow is a desktop application that allows you to follow your favorite websites, much like you would "follow" on social media.

## Features

- Follow your favorite websites
- Get notified when your favorite websites are updated
- Save your favorite websites

## Mechanics

- Use RSS feeds to get notified when your favorite websites are updated
- Use PWA manifest files to get icons and titles for your favorite websites (when available)
    - If no manifest is found, use the website's title as the name and a generic icon or favicon
- Use a database to save your favorite websites
- Use a notification system to notify you when your favorite websites are updated
- Use a scheduler to check for updates every hour (configurable)

## UI

- Use Tauri to create a desktop application
- Both light and dark themes
- Use a simple and modern UI
- Command (or Control) + K brings up a command bar
  - Putting a URL in this bar and pressing enter will add it to your list of websites to follow
- You "install" a website by adding it to your list of websites to follow, it becomes like an app in Follow

## Views

- Home
  - List of installed websites
- Settings
  - Notification settings
  - Scheduler settings
- Command Bar
  - Command (or Control) + K brings up a command bar
  - Putting a URL in this bar and pressing enter will add it to your list of websites to follow
- Notification Bar
  - Shows updates
  - Shows errors
