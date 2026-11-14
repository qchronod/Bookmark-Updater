(function () {
    function matches(url) {
        return url.hostname === "royalroad.com" || url.hostname.endsWith(".royalroad.com");
    }

    function getStoryKey(url) {
        const segments = url.pathname.split("/").filter(Boolean);
        const fictionIndex = segments.indexOf("fiction");
        if (fictionIndex === -1 || segments.length <= fictionIndex + 1) return null;
        return `${url.hostname.replace(/^www\./, "")}/fiction/${segments[fictionIndex + 1]}`;
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

        const chapterPublication = [...document.querySelectorAll('time[dateonly="true"][datetime]')].find(time => {
            const title = time.getAttribute("title") || "";
            const precedingText = [];
            for (let sibling = time.previousSibling; sibling; sibling = sibling.previousSibling) {
                precedingText.push(sibling.textContent || "");
            }
            return !/\bedited at\b/i.test(`${title} ${precedingText.join(" ")}`);
        });
        if (chapterPublication) {
            const date = toIsoDate(chapterPublication.getAttribute("datetime"));
            if (date) return date;
        }

        const published = [...document.querySelectorAll("time[datetime]")].find(time =>
            time.closest("li")?.querySelector('i[title="Published"]')
        );
        return toIsoDate(published?.getAttribute("datetime"));
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractPublicationDate
    });
})();
