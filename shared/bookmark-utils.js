(function () {
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

    function getSiteAdapter(urlStr) {
        try {
            const url = new URL(urlStr);
            return (globalThis.BookmarkUpdaterSiteAdapters || []).find(adapter => adapter.matches(url)) || null;
        } catch (error) {
            return null;
        }
    }

    function getStoryKey(urlStr) {
        try {
            const url = new URL(urlStr);
            const adapter = getSiteAdapter(urlStr);
            const siteKey = adapter?.getStoryKey?.(url);
            if (siteKey) return siteKey;

            const segments = url.pathname.split("/").filter(Boolean);
            if (segments.length >= 2) {
                return `${url.hostname}/${segments[0]}/${segments[1]}`;
            }
            return url.hostname;
        } catch (error) {
            return urlStr;
        }
    }

    function getBookmarkDomain(urlStr) {
        try {
            return new URL(urlStr).hostname.replace(/^www\./, "");
        } catch (error) {
            return null;
        }
    }

    function flattenBookmarks(nodes, out = []) {
        for (const node of nodes) {
            if (node.url) out.push(node);
            if (node.children) flattenBookmarks(node.children, out);
        }
        return out;
    }

    function flattenBookmarksInFolder(nodes, folderName, out = [], insideFolder = false) {
        for (const node of nodes) {
            const isFolder = !node.url && node.title === folderName;
            if (node.url && insideFolder) out.push(node);
            if (node.children) {
                flattenBookmarksInFolder(node.children, folderName, out, insideFolder || isFolder);
            }
        }
        return out;
    }

    function parseTitleDate(title) {
        const match = title.match(/^\s*((?:[^\p{L}\p{N}\s]\s*){0,2})(?:(\d{4})-(\d{2})-(\d{2})|(\d{4})\/(\d{2})\/(\d{2})|(\d{2})\/(\d{2})\/(\d{2})|(\d{2})\/(\d{2})\/(\d{4}))(?=\s|$)/u);
        if (!match) return null;

        const year = Number(match[2] || match[5] || match[13] || `20${match[10]}`);
        const month = Number(match[3] || match[6] || match[9] || match[12]);
        const day = Number(match[4] || match[7] || match[8] || match[11]);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            return null;
        }
        return {
            year,
            month,
            day,
            dateStart: title.match(/^\s*/)[0].length + match[1].length,
            dateLength: match[2] || match[5] || match[11] ? 10 : 8
        };
    }

    function getUpdatedTitle(title, publicationDate) {
        const dateMatch = publicationDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!dateMatch) return null;

        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        const day = Number(dateMatch[3]);
        const current = new Date(Date.UTC(year, month - 1, day));
        if (current.getUTCFullYear() !== year || current.getUTCMonth() !== month - 1 || current.getUTCDate() !== day) {
            return null;
        }

        const existing = parseTitleDate(title);
        if (!existing && /^\s*(?:[^\p{L}\p{N}\s]\s*){0,2}(?:\d{4}-\d{2}-\d{2}|\d{4}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{2}|\d{2}\/\d{2}\/\d{4})(?=\s|$)/u.test(title)) {
            return null;
        }
        if (existing && Date.UTC(year, month - 1, day) <= Date.UTC(existing.year, existing.month - 1, existing.day)) {
            return null;
        }

        const newDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        if (existing) {
            const rest = title.slice(existing.dateStart + existing.dateLength);
            return { title: `${title.slice(0, existing.dateStart)}${newDate}${rest}`, displayDate: newDate };
        }
        return { title: `${newDate}${title ? ` - ${title}` : ""}`, displayDate: newDate };
    }

    function getDateUpdate(bookmarks, publicationDate) {
        if (!publicationDate) return null;
        const updates = bookmarks
            .map(bookmark => ({ id: bookmark.id, update: getUpdatedTitle(bookmark.title || "", publicationDate) }))
            .filter(item => item.update);
        if (!updates.length) return null;
        return {
            date: publicationDate,
            ids: updates.map(item => item.id),
            displayDate: updates[0].update.displayDate
        };
    }

    globalThis.BookmarkUpdaterUtils = {
        cleanUrl,
        flattenBookmarks,
        flattenBookmarksInFolder,
        getDateUpdate,
        getBookmarkDomain,
        getSiteAdapter,
        getStoryKey,
        getUpdatedTitle
    };
})();
