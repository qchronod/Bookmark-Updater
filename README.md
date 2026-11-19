# Story Bookmark Updater

A browser extension designed for web novel and fiction readers. It automatically updates your existing story bookmarks to the current chapter URL you are reading while preserving your custom titles and stripping out tracking tags (`?utm_...`, `?ref=...`). Separate Chrome and Firefox builds are included.

## Features
- **URL-Based Matching:** Recognizes story paths (e.g., Royal Road, Scribble Hub) so it finds your bookmark no matter what chapter you are on.
- **Comics Folder Fallback:** If story-path matching finds nothing, matches a bookmark in a folder named `Comics` when it is the only distinct bookmark URL for the active domain.
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

On supported sites, the extension offers a separate button to update a bookmark's leading date when the page's publication date is newer and falls within the past 20 years, not in the future. It reads dates from Royal Road, Scribble Hub, Wattpad, WebNovel, and XenForo forum posts with a post anchor. It normalizes an existing leading `DD/MM/YY`, `DD/MM/YYYY`, `YYYY-MM-DD`, or `YYYY/MM/DD` date to `YYYY/MM/DD` and preserves up to two punctuation or symbol characters before it; when an ambiguous two-digit slash date would be later than the publication date as `DD/MM/YY` but earlier as `YY/MM/DD`, it uses the latter interpretation. If the title has no leading date, it offers to add one as `YYYY/MM/DD - Title` for chronological sorting. The bookmark date is never changed automatically.

## Contributing

Shared bookmark logic and individual site adapters live in `shared/`. Add or update a site adapter under `shared/site-adapters/`, then run `.\sync-shared.ps1` from the repository root. The script bundles the adapters and syncs shared code into both browser builds.

Bump the version in both browser manifests when making a bug fix or adding a feature. For substantial iterative changes, call out when multiple version bumps may be appropriate. The script bundles the adapters and syncs shared code into both browser builds.
