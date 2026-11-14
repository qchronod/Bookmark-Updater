(function () {
    const utils = globalThis.BookmarkUpdaterUtils;
    const usePromiseApi = typeof globalThis.browser !== "undefined";

    function chromeCall(invoke) {
        return new Promise((resolve, reject) => {
            invoke(result => {
                const error = chrome.runtime.lastError;
                if (error) reject(new Error(error.message));
                else resolve(result);
            });
        });
    }

    function queryActiveTab() {
        if (usePromiseApi) {
            return browser.tabs.query({ active: true, currentWindow: true });
        }
        return chromeCall(callback =>
            chrome.tabs.query({ active: true, currentWindow: true }, callback)
        );
    }

    function executeScript(tabId, func) {
        const details = { target: { tabId }, func };
        if (usePromiseApi) return browser.scripting.executeScript(details);
        return chromeCall(callback => chrome.scripting.executeScript(details, callback));
    }

    function getBookmarkTree() {
        if (usePromiseApi) return browser.bookmarks.getTree();
        return chromeCall(callback => chrome.bookmarks.getTree(callback));
    }

    function getBookmarks(ids) {
        if (usePromiseApi) return Promise.all(ids.map(id => browser.bookmarks.get(id))).then(results => results.flat());
        return Promise.all(ids.map(id =>
            chromeCall(callback => chrome.bookmarks.get(id, callback))
        )).then(results => results.flat());
    }

    function updateBookmark(id, changes) {
        if (usePromiseApi) return browser.bookmarks.update(id, changes);
        return chromeCall(callback => chrome.bookmarks.update(id, changes, callback));
    }

    async function getPublicationDate(tabId, adapter) {
        if (!adapter?.extractPublicationDate) return null;
        const results = await executeScript(tabId, adapter.extractPublicationDate);
        const result = results[0];
        if (result?.error) {
            throw new Error(result.error.message || String(result.error));
        }
        return result?.result || null;
    }

    async function getPageStoryKey(tabId, adapter) {
        if (!adapter?.extractStoryKey) return null;
        const results = await executeScript(tabId, adapter.extractStoryKey);
        const result = results[0];
        if (result?.error) {
            throw new Error(result.error.message || String(result.error));
        }
        return result?.result || null;
    }

    async function findAndMatchBookmarks() {
        const [currentTab] = await queryActiveTab();
        if (!currentTab) return { status: "error", message: "No active tab found." };
        if (!currentTab.url) return { status: "error", message: "The active tab has no accessible URL." };

        const currentUrl = utils.cleanUrl(currentTab.url);
        const adapter = utils.getSiteAdapter(currentUrl);
        const pageStoryKey = await getPageStoryKey(currentTab.id, adapter);
        const currentStoryKey = pageStoryKey || utils.getStoryKey(currentUrl);
        let publicationDate = null;
        let publicationDateError = null;
        try {
            publicationDate = await getPublicationDate(currentTab.id, adapter);
        } catch (error) {
            console.error("Could not read the page publication date:", error);
            publicationDateError = error instanceof Error ? error.message : String(error);
        }

        const bookmarkTreeNodes = await getBookmarkTree();
        const matches = utils.flattenBookmarks(bookmarkTreeNodes).filter(bookmark =>
            utils.getStoryKey(bookmark.url) === currentStoryKey
        );
        const currentUrlMatches = matches.filter(bookmark => bookmark.url === currentUrl);
        const updateMatches = matches.filter(bookmark => bookmark.url !== currentUrl);
        const bookmarksByUrl = new Map();

        for (const bookmark of updateMatches) {
            if (!bookmarksByUrl.has(bookmark.url)) bookmarksByUrl.set(bookmark.url, []);
            bookmarksByUrl.get(bookmark.url).push(bookmark);
        }

        const uniqueMatches = [...bookmarksByUrl.entries()];
        if (uniqueMatches.length === 0) {
            if (!currentUrlMatches.length) return { status: "not_found", storyName: currentStoryKey };
            return {
                status: "updated",
                alreadyCurrent: true,
                bookmark: { title: currentUrlMatches[0].title },
                dateUpdate: utils.getDateUpdate(currentUrlMatches, publicationDate),
                publicationDate,
                publicationDateError
            };
        }

        if (uniqueMatches.length === 1) {
            const [, bookmarks] = uniqueMatches[0];
            await Promise.all(bookmarks.map(bookmark =>
                updateBookmark(bookmark.id, { url: currentUrl })
            ));
            return {
                status: "updated",
                bookmark: { title: bookmarks[0].title },
                dateUpdate: utils.getDateUpdate(bookmarks, publicationDate),
                publicationDate,
                publicationDateError
            };
        }

        return {
            status: "multiple",
            matches: uniqueMatches.map(([url, bookmarks]) => ({
                ...bookmarks[0],
                ids: bookmarks.map(bookmark => bookmark.id),
                url
            })),
            currentUrl,
            publicationDate,
            publicationDateError
        };
    }

    async function updateSpecificBookmark(request) {
        const ids = request.ids || [request.id];
        const bookmarks = await getBookmarks(ids);
        const sanitizedUrl = utils.cleanUrl(request.url);
        await Promise.all(bookmarks.map(bookmark =>
            updateBookmark(bookmark.id, { url: sanitizedUrl })
        ));
        return {
            status: "success",
            dateUpdate: utils.getDateUpdate(bookmarks, request.publicationDate),
            publicationDate: request.publicationDate || null,
            publicationDateError: request.publicationDateError || null
        };
    }

    async function updateBookmarkDate(request) {
        const bookmarks = await getBookmarks(request.ids);
        const updates = bookmarks
            .map(bookmark => ({ bookmark, update: utils.getUpdatedTitle(bookmark.title || "", request.date) }))
            .filter(item => item.update);
        await Promise.all(updates.map(({ bookmark, update }) =>
            updateBookmark(bookmark.id, { title: update.title })
        ));
        return { status: updates.length ? "success" : "unchanged" };
    }

    function isSupportedAction(action) {
        return action === "findAndMatchBookmarks" ||
            action === "updateSpecificBookmark" ||
            action === "updateBookmarkDate";
    }

    async function handleRequest(request) {
        if (request.action === "findAndMatchBookmarks") return findAndMatchBookmarks();
        if (request.action === "updateSpecificBookmark") return updateSpecificBookmark(request);
        if (request.action === "updateBookmarkDate") return updateBookmarkDate(request);
        return undefined;
    }

    function errorResponse(error) {
        return {
            status: "error",
            message: error instanceof Error ? error.message : String(error)
        };
    }

    if (usePromiseApi) {
        browser.runtime.onMessage.addListener(async request => {
            try {
                return await handleRequest(request);
            } catch (error) {
                console.error("Bookmark updater request failed:", error);
                return errorResponse(error);
            }
        });
    } else {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!isSupportedAction(request.action)) return false;

            handleRequest(request).then(sendResponse).catch(error => {
                console.error("Bookmark updater request failed:", error);
                sendResponse(errorResponse(error));
            });
            return true;
        });
    }
})();
