# Story Bookmark Updater

A browser extension designed for web novel and fiction readers. It automatically updates your existing story bookmarks to the current chapter URL you are reading while preserving your custom titles and stripping out tracking tags (`?utm_...`, `?ref=...`). Separate Chrome and Firefox builds are included.

## Features
- **URL-Based Matching:** Recognizes story paths (e.g., Royal Road, Scribble Hub) so it finds your bookmark no matter what chapter you are on.
- **Custom Title Preservation:** Leaves your custom names completely untouched.
- **Tracker Stripping:** Automatically cleans tracking parameters out of URLs before saving.
- **Smart Deduplication:** Updates duplicate bookmark instances silently across multiple folders.
- **Multi-Story Prompting:** Asks you to choose if it detects multiple separate substories or distinct links.

## How to Install

### Chrome, Edge, or Brave
1. Download or clone this repository and extract it to a folder.
2. Open the browser's extensions page (`chrome://extensions/` in Chrome).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `chrome` folder.

### Firefox
1. Download or clone this repository and extract it to a folder.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select `firefox/manifest.json`.

The Firefox add-on loaded this way is temporary and must be loaded again after Firefox restarts. For permanent distribution, the add-on must be signed by Mozilla.

## Future work
- Possible option to auto-update save dates to name.
- Who knows...