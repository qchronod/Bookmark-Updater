# Story Bookmark Updater

A browser extension designed for web novel and fiction readers. It automatically updates your existing story bookmarks to the current chapter URL you are reading while preserving your custom titles and stripping out tracking tags (`?utm_...`, `?ref=...`). Separate Chrome and Firefox builds are included.

## Features
- **URL-Based Matching:** Recognizes story paths (e.g., Royal Road, Scribble Hub) so it finds your bookmark no matter what chapter you are on.
- **Custom Title Preservation:** Leaves your custom names completely untouched.
- **Tracker Stripping:** Automatically cleans tracking parameters out of URLs before saving.
- **Smart Deduplication:** Updates duplicate bookmark instances silently across multiple folders.
- **Multi-Story Prompting:** Asks you to choose if it detects multiple separate substories or distinct links.
- **Optional Date Updates:** Offers to update an older leading bookmark date when a supported publication date is available.

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

On supported sites, the extension offers a separate button to update a bookmark's leading date when the page's publication date is newer. It reads dates from Royal Road, Scribble Hub, Wattpad, WebNovel, and XenForo forum posts with a post anchor. It preserves an existing `DD/MM/YY`, `YYYY-MM-DD`, or `YYYY/MM/DD` date style and up to two punctuation or symbol characters before the date; if the title has no leading date, it offers to add one as `YYYY/MM/DD - Title` for chronological sorting. The bookmark date is never changed automatically.

## Contributing

Shared bookmark logic and individual site adapters live in `shared/`. Add or update a site adapter under `shared/site-adapters/`, then run `.\sync-shared.ps1` from the repository root. The script bundles the adapters and syncs shared code into both browser builds.
