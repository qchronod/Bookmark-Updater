function cleanUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        const keysToDelete = [];

        for (const key of url.searchParams.keys()) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.startsWith("utm_") ||
                lowerKey === "ref" ||
                lowerKey === "fbclid" ||
                lowerKey === "gclid" ||
                lowerKey === "source"
            ) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => url.searchParams.delete(key));
        return url.toString().replace(/\?$/, "");
    } catch (error) {
        return urlStr;
    }
}

function getStoryKey(urlStr) {
    try {
        const url = new URL(urlStr);
        const hostname = url.hostname;
        const segments = url.pathname.split("/").filter(Boolean);

        if (hostname.includes("royalroad.com")) {
            const fictionIndex = segments.indexOf("fiction");
            if (fictionIndex !== -1 && segments.length > fictionIndex + 1) {
                return `${hostname}/fiction/${segments[fictionIndex + 1]}`;
            }
        } else if (hostname.includes("scribblehub.com")) {
            const readIndex = segments.indexOf("read");
            if (readIndex !== -1 && segments.length > readIndex) {
                const match = segments[readIndex + 1].match(/^\d+/);
                if (match) return `${hostname}/read/${match[0]}`;
            }
        }

        if (segments.length >= 2) {
            return `${hostname}/${segments[0]}/${segments[1]}`;
        }
        return hostname;
    } catch (error) {
        return urlStr;
    }
}

function flattenBookmarks(nodes, out = []) {
    for (const node of nodes) {
        if (node.url) out.push(node);
        if (node.children) flattenBookmarks(node.children, out);
    }
    return out;
}

async function findAndMatchBookmarks() {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!currentTab) {
        return { status: "error", message: "No active tab found." };
    }
    if (!currentTab.url) {
        return { status: "error", message: "The active tab has no accessible URL." };
    }

    const currentUrl = cleanUrl(currentTab.url);
    const currentStoryKey = getStoryKey(currentUrl);
    const bookmarkTreeNodes = await browser.bookmarks.getTree();
    const matches = flattenBookmarks(bookmarkTreeNodes).filter(bookmark => {
        return bookmark.url !== currentUrl && getStoryKey(bookmark.url) === currentStoryKey;
    });

    const bookmarksByUrl = new Map();
    for (const bookmark of matches) {
        if (!bookmarksByUrl.has(bookmark.url)) bookmarksByUrl.set(bookmark.url, []);
        bookmarksByUrl.get(bookmark.url).push(bookmark);
    }

    const uniqueMatches = [...bookmarksByUrl.entries()];
    if (uniqueMatches.length === 0) {
        return { status: "not_found", storyName: currentStoryKey };
    }
    if (uniqueMatches.length === 1) {
        const [url, bookmarks] = uniqueMatches[0];
        await Promise.all(bookmarks.map(bookmark =>
            browser.bookmarks.update(bookmark.id, { url: currentUrl })
        ));
        return { status: "updated", bookmark: { title: bookmarks[0].title } };
    }

    return {
        status: "multiple",
        matches: uniqueMatches.map(([, bookmarks]) => bookmarks[0]),
        currentUrl
    };
}

browser.runtime.onMessage.addListener(async request => {
    try {
        if (request.action === "findAndMatchBookmarks") {
            return await findAndMatchBookmarks();
        }
        if (request.action === "updateSpecificBookmark") {
            const sanitizedUrl = cleanUrl(request.url);
            await browser.bookmarks.update(request.id, { url: sanitizedUrl });
            return { status: "success" };
        }
        return undefined;
    } catch (error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : String(error)
        };
    }
});
