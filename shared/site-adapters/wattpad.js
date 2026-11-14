(function () {
    function matches(url) {
        return url.hostname === "wattpad.com" || url.hostname.endsWith(".wattpad.com");
    }

    function getStoryKey(url) {
        const storyId = url.pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        if (!storyId) return null;
        return `wattpad.com/story/${storyId}`;
    }

    function extractStoryKey() {
        const storyLink = document.querySelector('#funbar-story .toc-header a[href*="/story/"]');
        const storyId = storyLink &&
            new URL(storyLink.href).pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        return storyId ? `wattpad.com/story/${storyId}` : null;
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            const isoDate = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return isoDate ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` : null;
        }

        const storyLink = document.querySelector('#funbar-story .toc-header a[href*="/story/"]');
        const storyId = storyLink &&
            new URL(storyLink.href).pathname.match(/^\/story\/(\d+)(?:-|\/|$)/)?.[1];
        const partId = location.pathname.match(/^\/(\d+)(?:-|$)/)?.[1];
        if (!storyId || !partId) return null;

        return fetch(`/api/v3/stories/${storyId}?fields=parts(id,createDate)`, {
            credentials: "include"
        }).then(async response => {
            if (!response.ok) return null;
            const story = await response.json();
            const part = story.parts?.find(item => String(item.id) === partId);
            return toIsoDate(part?.createDate);
        }).catch(error => {
            console.error("Could not read the Wattpad chapter publication date:", error);
            return null;
        });
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractStoryKey,
        extractPublicationDate
    });
})();
