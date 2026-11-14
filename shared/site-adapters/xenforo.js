(function () {
    function matches(url) {
        return url.hostname === "spacebattles.com" ||
            url.hostname.endsWith(".spacebattles.com") ||
            url.hostname === "sufficientvelocity.com" ||
            url.hostname.endsWith(".sufficientvelocity.com");
    }

    function extractPublicationDate() {
        function toIsoDate(value) {
            if (!value) return null;
            const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
            if (/\b(?:ago|just now|today|yesterday)\b/i.test(value)) return null;

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return null;
            return [
                parsed.getFullYear(),
                String(parsed.getMonth() + 1).padStart(2, "0"),
                String(parsed.getDate()).padStart(2, "0")
            ].join("-");
        }

        const postId = location.hash.match(/^#post-(\d+)$/)?.[1];
        const post = postId && document.getElementById(`js-post-${postId}`);
        return toIsoDate(post?.querySelector('time[itemprop="datePublished"][datetime]')?.dateTime);
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        extractPublicationDate
    });
})();
