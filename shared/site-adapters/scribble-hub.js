(function () {
    function matches(url) {
        return url.hostname === "scribblehub.com" || url.hostname.endsWith(".scribblehub.com");
    }

    function getStoryKey(url) {
        const segments = url.pathname.split("/").filter(Boolean);
        const readIndex = segments.indexOf("read");
        const seriesIndex = segments.indexOf("series");
        const storyId = readIndex !== -1 && segments.length > readIndex + 1
            ? segments[readIndex + 1].match(/^\d+/)?.[0]
            : seriesIndex !== -1 && segments.length > seriesIndex + 1
                ? segments[seriesIndex + 1].match(/^\d+/)?.[0]
                : null;
        if (!storyId) return null;
        return `${url.hostname.replace(/^www\./, "")}/story/${storyId}`;
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

        const chapterId = location.pathname.match(/\/chapter\/(\d+)/)?.[1];
        const seriesUrl = document.querySelector('.chp_byauthor a[href*="/series/"]')?.href;
        if (!chapterId || !seriesUrl) return null;

        return fetch(seriesUrl, { credentials: "include" }).then(async response => {
            if (!response.ok) return null;
            const html = await response.text();
            const seriesDocument = new DOMParser().parseFromString(html, "text/html");
            const chapterLink = [...seriesDocument.querySelectorAll(".toc_w a[href]")].find(link =>
                new URL(link.href).pathname.match(/\/chapter\/(\d+)/)?.[1] === chapterId
            );
            const date = chapterLink?.closest(".toc_w")?.querySelector(".fic_date_pub");
            return toIsoDate(date?.getAttribute("title") || date?.textContent?.trim());
        }).catch(error => {
            console.error("Could not read the Scribble Hub publication date:", error);
            return null;
        });
    }

    globalThis.BookmarkUpdaterSiteAdapters = globalThis.BookmarkUpdaterSiteAdapters || [];
    globalThis.BookmarkUpdaterSiteAdapters.push({
        matches,
        getStoryKey,
        extractPublicationDate
    });
})();
