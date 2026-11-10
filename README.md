# Story Bookmark Updater

A Chrome Extension (Manifest V3) designed for web novel and fiction readers. It automatically updates your existing story bookmarks to the current chapter URL you are reading while preserving your custom titles and stripping out tracking tags (`?utm_...`, `?ref=...`).

## Features
- **URL-Based Matching:** Recognizes story paths (e.g., Royal Road, Scribble Hub) so it finds your bookmark no matter what chapter you are on.
- **Custom Title Preservation:** Leaves your custom names completely untouched.
- **Tracker Stripping:** Automatically cleans tracking parameters out of URLs before saving.
- **Smart Deduplication:** Updates duplicate bookmark instances silently across multiple folders.
- **Multi-Story Prompting:** Asks you to choose if it detects multiple separate substories or distinct links.

## How to Install (For Users)
1. Download or clone this repository as a `.zip` file and extract it to a folder on your computer.
2. Open Google Chrome (or Edge/Brave) and go to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Select the extracted extension folder.

## Future work
- Maybe one day getting around to doing a Firefox version.
- Possible option to auto-update save dates to name.
- Who knows...