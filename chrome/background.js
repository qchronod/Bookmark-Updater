// Function to strip out messy tracking parameters
function cleanUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        const searchParams = url.searchParams;
        const keysToDelete = [];

        for (const key of searchParams.keys()) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.startsWith('utm_') || 
                lowerKey === 'ref' || 
                lowerKey === 'fbclid' || 
                lowerKey === 'gclid' ||
                lowerKey === 'source'
            ) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(k => searchParams.delete(k));

        let finalUrl = url.toString();
        if (finalUrl.endsWith('?')) {
            finalUrl = finalUrl.slice(0, -1);
        }
        return finalUrl;
    } catch (e) {
        return urlStr;
    }
}

// Extract a unique story signature from the URL (e.g., matching the fiction ID/slug)
function getStoryKey(urlStr) {
    try {
        const url = new URL(urlStr);
        const hostname = url.hostname;
        const segments = url.pathname.split('/').filter(Boolean);
        
        // Handle Royal Road: matches /fiction/12345/story-name
        if (hostname.includes('royalroad.com')) {
            const fictionIdx = segments.indexOf('fiction');
            if (fictionIdx !== -1 && segments.length > fictionIdx + 1) {
                return `${hostname}/fiction/${segments[fictionIdx + 1]}`;
            }
        } 
        // Handle Scribble Hub: matches /read/12345-story-name
        else if (hostname.includes('scribblehub.com')) {
            const readIdx = segments.indexOf('read');
            if (readIdx !== -1 && segments.length > readIdx) {
                const match = segments[readIdx + 1].match(/^\d+/);
                if (match) return `${hostname}/read/${match[0]}`;
            }
        }
        
        // Generic fallback for other sites using the first two path segments
        if (segments.length >= 2) {
            return `${hostname}/${segments[0]}/${segments[1]}`;
        }
        return hostname;
    } catch (e) {
        return urlStr;
    }
}

// Helper to flatten the bookmark tree into a searchable array
function flattenBookmarks(nodes, out = []) {
    for (const node of nodes) {
        if (node.url) {
            out.push(node);
        }
        if (node.children) {
            flattenBookmarks(node.children, out);
        }
    }
    return out;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "findAndMatchBookmarks") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentTab = tabs[0];
            if (!currentTab) {
                sendResponse({ status: "error", message: "No active tab found." });
                return;
            }

            const currentUrl = cleanUrl(currentTab.url);
            const currentStoryKey = getStoryKey(currentUrl);

            chrome.bookmarks.getTree((bookmarkTreeNodes) => {
                const allBookmarks = flattenBookmarks(bookmarkTreeNodes);
                
                let matches = allBookmarks.filter(b => {
                    if (b.url === currentUrl) return false;
                    return getStoryKey(b.url) === currentStoryKey;
                });

                const uniqueUrlsMap = {};
                matches.forEach(m => {
                    if (!uniqueUrlsMap[m.url]) {
                        uniqueUrlsMap[m.url] = [];
                    }
                    uniqueUrlsMap[m.url].push(m.id);
                });

                const uniqueUrlKeys = Object.keys(uniqueUrlsMap);

                if (uniqueUrlKeys.length === 0) {
                    sendResponse({ status: "not_found", storyName: currentStoryKey });
                } else if (uniqueUrlKeys.length === 1) {
                    const idsToUpdate = uniqueUrlsMap[uniqueUrlKeys[0]];
                    let completed = 0;

                    const matchedBookmark = matches.find(m => m.url === uniqueUrlKeys[0]);
                    const bookmarkTitle = matchedBookmark ? matchedBookmark.title : "Bookmark";

                    idsToUpdate.forEach(id => {
                        chrome.bookmarks.update(id, { url: currentUrl }, () => {
                            completed++;
                            if (completed === idsToUpdate.length) {
                                sendResponse({ 
                                    status: "updated", 
                                    bookmark: { title: bookmarkTitle } 
                                });
                            }
                        });
                    });
                } else {
                    const representativeMatches = uniqueUrlKeys.map(url => {
                        return matches.find(m => m.url === url);
                    });

                    sendResponse({ 
                        status: "multiple", 
                        matches: representativeMatches, 
                        currentUrl: currentUrl 
                    });
                }
            });
        });
        return true; 
    }

    if (request.action === "updateSpecificBookmark") {
        const { id, url } = request;
        const sanitizedUrl = cleanUrl(url);
        chrome.bookmarks.update(id, { url: sanitizedUrl }, () => {
            sendResponse({ status: "success" });
        });
        return true;
    }
});